import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Lectern,
  Globe,
  Users,
  Star,
  CalendarBlank,
  GraduationCap,
  BookOpen,
  Strategy,
  Trophy,
  ChartLineUp,
  Warning,
  CheckCircle,
  XCircle,
  CaretDown,
  CaretUp,
  Flag,
  Buildings,
  Handshake,
  Scales,
  MagnifyingGlass,
  Compass,
  ListBullets,
} from "@phosphor-icons/react";
import { SourceLink } from "../components/SourceLink";
// Globe is used in LeaderDetail tabs — do not remove

// ── Political Compass Coordinates ─────────────────────────────────────────────
// economicX: -10 (far left) to +10 (far right)
// socialY:   -10 (authoritarian) to +10 (libertarian)
interface CompassCoords {
  economicX: number;
  socialY: number;
}

const COMPASS_DATA: Record<string, CompassCoords> = {
  trump: { economicX: 5.5, socialY: -3.0 },
  xi: { economicX: -5.0, socialY: -9.0 },
  putin: { economicX: 2.0, socialY: -8.5 },
  modi: { economicX: 4.0, socialY: -5.0 },
  macron: { economicX: 3.5, socialY: 3.5 },
  scholz: { economicX: -1.5, socialY: 2.5 },
  sunak: { economicX: 5.0, socialY: 1.0 },
  starmer: { economicX: -2.0, socialY: 3.0 },
  zelensky: { economicX: 0.5, socialY: 1.5 },
  mbs: { economicX: 4.5, socialY: -8.0 },
  lula: { economicX: -4.5, socialY: 3.5 },
  kim: { economicX: -8.0, socialY: -10 },
  netanyahu: { economicX: 5.0, socialY: -4.5 },
  erdogan: { economicX: 0.5, socialY: -6.0 },
  meloni: { economicX: 3.5, socialY: -3.0 },
  sheinbaum: { economicX: -3.5, socialY: 3.0 },
  albanese: { economicX: -2.5, socialY: 4.0 },
  ramaphosa: { economicX: -2.0, socialY: 2.5 },
  khan: { economicX: 3.0, socialY: -2.5 },
  milei: { economicX: 9.5, socialY: 6.0 },
  carney: { economicX: 0.5, socialY: 3.5 },
  ishiba: { economicX: 3.0, socialY: -1.5 },
  sanchez: { economicX: -3.0, socialY: 5.0 },
  bukele: { economicX: 2.5, socialY: -6.5 },
  prabowo: { economicX: 1.5, socialY: -4.5 },
  pezeshkian: { economicX: -1.5, socialY: -4.0 },
  han: { economicX: 3.5, socialY: -1.0 },
  tusk: { economicX: 2.5, socialY: 4.0 },
  maduro: { economicX: -8.0, socialY: -7.0 },
  mbz: { economicX: 4.0, socialY: -8.5 },
  mnangagwa: { economicX: 0.0, socialY: -7.5 },
  kagame: { economicX: 2.0, socialY: -7.5 },
  tinubu: { economicX: 3.5, socialY: -3.5 },
  abiy: { economicX: 0.5, socialY: -6.5 },
  sisi: { economicX: 1.5, socialY: -8.5 },
  yunus: { economicX: -2.0, socialY: 5.5 },
  dissanayake: { economicX: -4.0, socialY: 3.0 },
  marcos: { economicX: 3.0, socialY: -3.5 },
  paetongtarn: { economicX: -1.5, socialY: -2.5 },
  anwar: { economicX: -1.0, socialY: 2.5 },
  frederik: { economicX: 1.0, socialY: 4.5 },
  kristersson: { economicX: 4.0, socialY: -1.5 },
  orpo: { economicX: 4.0, socialY: -1.0 },
  khamenei: { economicX: -4.0, socialY: -10 },
  aoun: { economicX: 1.0, socialY: -4.0 },
  alsharaa: { economicX: 0.0, socialY: -5.0 },
  barzani: { economicX: 3.5, socialY: -2.5 },
  petro: { economicX: -5.5, socialY: 4.5 },
  boluarte: { economicX: 1.5, socialY: -1.5 },
  noboa: { economicX: 5.0, socialY: -4.5 },
  ruto: { economicX: 3.0, socialY: -3.0 },
  goita: { economicX: -1.0, socialY: -7.0 },
  traore: { economicX: -2.5, socialY: -8.0 },
  phamminchinh: { economicX: -3.5, socialY: -7.5 },
  hunmanet: { economicX: -2.0, socialY: -8.5 },
  lee: { economicX: 4.5, socialY: 0.5 },
  muizzu: { economicX: 2.0, socialY: -5.5 },
  christodoulides: { economicX: 1.5, socialY: 3.5 },
  orban: { economicX: 2.0, socialY: -6.5 },
  merz: { economicX: 5.0, socialY: -0.5 },
  "lee-jm": { economicX: -3.5, socialY: 4.0 },
  boric: { economicX: -5.0, socialY: 5.5 },
  abdullah2: { economicX: 1.5, socialY: -4.0 },
  tamim: { economicX: 3.5, socialY: -7.5 },
  frederiksen: { economicX: -3.0, socialY: 4.5 },
  faye: { economicX: -3.5, socialY: 3.5 },
  tshisekedi: { economicX: -2.5, socialY: 0.5 },
  minaungHlaing: { economicX: -1.0, socialY: -9.5 },
  stubb: { economicX: 3.0, socialY: 4.0 },
  bayrou: { economicX: 1.0, socialY: 3.0 },
  luxon: { economicX: 5.0, socialY: 0.0 },
  "montenegro-lu": { economicX: 4.0, socialY: 0.0 },
  nehammer: { economicX: 4.5, socialY: -2.0 },
  kickl: { economicX: 3.0, socialY: -5.5 },
  fiala: { economicX: 4.0, socialY: 1.0 },
  mitsotakis: { economicX: 5.0, socialY: 0.5 },
  schoof: { economicX: 3.5, socialY: -2.0 },
  zhelyazkov: { economicX: 3.5, socialY: -1.5 },
  vucic: { economicX: 1.5, socialY: -5.5 },
  rama: { economicX: -1.5, socialY: 3.0 },
  "keller-sutter": { economicX: 5.0, socialY: 2.0 },
  abela: { economicX: -1.5, socialY: 3.5 },
  frieden: { economicX: 4.5, socialY: 1.5 },
  nauseda: { economicX: 3.0, socialY: 1.5 },
  silina: { economicX: 3.5, socialY: 1.5 },
  karis: { economicX: 3.0, socialY: 2.5 },
  golob: { economicX: -2.0, socialY: 5.5 },
  becirovic: { economicX: -2.5, socialY: 3.0 },
  spajic: { economicX: 2.5, socialY: 4.5 },
  mickoski: { economicX: 3.0, socialY: -2.5 },
  kurti: { economicX: -3.0, socialY: 4.5 },
  sandu: { economicX: 1.5, socialY: 4.5 },
  hichilema: { economicX: 4.5, socialY: 3.0 },
  hassan: { economicX: -1.5, socialY: 1.5 },
  zourabichvili: { economicX: 2.0, socialY: 5.0 },
  rinkevicius: { economicX: 2.5, socialY: 5.0 },
  chakwera: { economicX: 0.0, socialY: 1.0 },
  "akufo-addo": { economicX: 5.0, socialY: 2.0 },
  tokayev: { economicX: 2.0, socialY: -5.5 },
  aliyev: { economicX: 3.0, socialY: -7.5 },
  lukashenko: { economicX: -5.0, socialY: -9.5 },
  museveni: { economicX: 1.5, socialY: -6.5 },
  mahama: { economicX: -2.5, socialY: 3.0 },
  tebboune: { economicX: -2.0, socialY: -5.5 },
  ouattara: { economicX: 4.5, socialY: -1.5 },
  decroo: { economicX: 4.0, socialY: 4.5 },
  stoere: { economicX: -3.5, socialY: 4.5 },
  frostadottir: { economicX: -3.5, socialY: 5.5 },
  martin: { economicX: 0.5, socialY: 3.0 },
  fico: { economicX: -1.0, socialY: -5.0 },
  ciolacu: { economicX: -2.0, socialY: -2.0 },
  plenkovic: { economicX: 3.5, socialY: -0.5 },
  lai: { economicX: 2.0, socialY: 5.5 },
  mirziyoyev: { economicX: 2.5, socialY: -6.0 },
  rahmon: { economicX: -3.0, socialY: -8.5 },
  orsi: { economicX: -3.5, socialY: 5.0 },
  ortega: { economicX: -7.5, socialY: -7.5 },
  guterres: { economicX: -2.5, socialY: 6.0 },
  biya: { economicX: 0.5, socialY: -8.0 },
  kobakhidze: { economicX: 1.0, socialY: -5.0 },
  yoon: { economicX: 4.5, socialY: -3.5 },
  chaves: { economicX: 4.5, socialY: -2.0 },
  touadera: { economicX: 0.0, socialY: -5.0 },
  afwerki: { economicX: -7.0, socialY: -9.5 },
  assoumani: { economicX: 1.0, socialY: -6.5 },
  deby: { economicX: 0.0, socialY: -7.0 },
  akhannouch: { economicX: 4.5, socialY: -2.5 },
  barrow: { economicX: 0.5, socialY: 2.5 },
  sassou: { economicX: -1.5, socialY: -7.0 },
  gnassingbe: { economicX: 2.0, socialY: -6.5 },
  boko: { economicX: 4.0, socialY: 4.0 },
  arevalo: { economicX: -3.0, socialY: 5.0 },
  ali: { economicX: -2.0, socialY: 2.5 },
  lourenco: { economicX: -0.5, socialY: -2.5 },
  chapo: { economicX: -2.0, socialY: -4.5 },
  simina: { economicX: 0.5, socialY: 3.5 },
  berdymukhamedov: { economicX: -1.0, socialY: -9.5 },
  pashinyan: { economicX: 1.5, socialY: 4.5 },
  meleshanu: { economicX: 2.0, socialY: 2.5 },
  fiame: { economicX: -2.5, socialY: 4.0 },
  marape: { economicX: 1.5, socialY: -2.0 },
  henry: { economicX: 0.0, socialY: 0.0 },
  rowley: { economicX: 2.5, socialY: -2.0 },
  ngirente: { economicX: 1.5, socialY: -7.5 },
  guelleh: { economicX: 2.0, socialY: -7.0 },
  "castro-z": { economicX: -4.5, socialY: 3.0 },
  dabaiba: { economicX: 0.0, socialY: -4.0 },
  kiir: { economicX: -0.5, socialY: -7.5 },
  netumbo: { economicX: -2.5, socialY: 2.5 },
  mswati: { economicX: 2.0, socialY: -9.5 },
  japarov: { economicX: 0.5, socialY: -6.0 },
  sogavare: { economicX: 0.0, socialY: -3.5 },
  sudani: { economicX: -1.0, socialY: -3.5 },
  radev: { economicX: -2.0, socialY: -1.5 },
  pellegrini: { economicX: -2.0, socialY: 2.5 },
  talon: { economicX: 4.0, socialY: -2.5 },
  nguema: { economicX: 0.5, socialY: -5.5 },
  doumbouya: { economicX: 0.0, socialY: -6.5 },
  sakellaropoulou: { economicX: 0.5, socialY: 5.5 },
  abbas: { economicX: -1.5, socialY: -2.0 },
  francis: { economicX: -3.5, socialY: 4.0 },
  bolkiah: { economicX: 3.5, socialY: -8.5 },
  imrankhan: { economicX: -1.0, socialY: -1.5 },
  "suu-kyi": { economicX: 0.5, socialY: 5.0 },
  karzai: { economicX: 1.5, socialY: -1.0 },
  sen: { economicX: -2.5, socialY: -8.5 },
  diaz_canel: { economicX: -8.5, socialY: -7.5 },
  haitham: { economicX: 3.0, socialY: -6.5 },
  marin: { economicX: -3.5, socialY: 5.5 },
  "to-lam": { economicX: -3.5, socialY: -8.0 },
  tsai: { economicX: 2.0, socialY: 5.0 },
  zuma: { economicX: -4.0, socialY: -4.5 },
  amlo: { economicX: -5.0, socialY: -2.5 },
  charles3: { economicX: 1.5, socialY: 3.5 },
  ardern: { economicX: -3.0, socialY: 6.0 },
  borisjohnson: { economicX: 4.0, socialY: -0.5 },
  jokowi: { economicX: 1.0, socialY: -1.5 },
  obiang: { economicX: 2.0, socialY: -9.5 },
  saied: { economicX: -2.0, socialY: -6.5 },
  duda: { economicX: 3.0, socialY: -4.5 },
  tchiani: { economicX: -1.5, socialY: -8.0 },
  mbr: { economicX: 5.0, socialY: -7.5 },
  boakai: { economicX: -1.5, socialY: 2.5 },
  arce: { economicX: -6.0, socialY: -1.5 },
  leo14: { economicX: -3.0, socialY: 5.0 },
  mohamud: { economicX: 0.5, socialY: -3.0 },
  burhan: { economicX: 0.5, socialY: -8.5 },
  ramkalawan: { economicX: -2.0, socialY: 4.5 },
  ndayishimiye: { economicX: -1.5, socialY: -5.0 },
  embalo: { economicX: 1.5, socialY: -4.5 },
  ghazouani: { economicX: 2.0, socialY: -3.0 },
  dodik: { economicX: 1.0, socialY: -6.5 },
  diaz_canel2: { economicX: -8.5, socialY: -7.5 },
};

// ── Types ──────────────────────────────────────────────────────────────────── v3
type Ideology =
  | "Conservative"
  | "Liberal"
  | "Social Democrat"
  | "Nationalist"
  | "Communist"
  | "Authoritarian"
  | "Centrist"
  | "Populist"
  | "Theocrat"
  | "Progressive"
  | "Military Junta"
  | "Monarchy";
type Status = "In Office" | "Incumbent (Disputed)" | "Transitional" | "Former";

interface Leader {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  title: string;
  photo: string;
  age: number;
  birthYear: number;
  birthPlace: string;
  education: { institution: string; degree: string; year?: number }[];
  party: string;
  ideology: Ideology;
  termsInOffice: { from: number; to: number | "present" }[];
  background: string;
  significantEvents: {
    year: number;
    event: string;
    impact: "positive" | "negative" | "neutral";
  }[];
  achievements: string[];
  politicalViews: string;
  approvalRating: number | null;
  approvalTrend: "up" | "down" | "stable";
  status: Status;
  impact: string;
  region: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const LEADERS: Leader[] = [
  {
    id: "trump",
    name: "Donald Trump",
    country: "United States",
    countryCode: "US",
    flag: "🇺🇸",
    title: "President-elect / 45th & 47th President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/440px-Donald_Trump_official_portrait.jpg",
    age: 78,
    birthYear: 1946,
    birthPlace: "Queens, New York, USA",
    education: [
      {
        institution: "Fordham University",
        degree: "B.S. Economics (transferred)",
        year: 1966,
      },
      {
        institution: "Wharton School, University of Pennsylvania",
        degree: "B.S. Economics",
        year: 1968,
      },
    ],
    party: "Republican Party",
    ideology: "Populist",
    termsInOffice: [
      { from: 2017, to: 2021 },
      { from: 2025, to: "present" },
    ],
    background:
      "Real-estate mogul and television personality who shocked the political establishment winning the 2016 election as a first-time candidate. First president to be impeached twice and to win a second non-consecutive term since Grover Cleveland.",
    significantEvents: [
      {
        year: 2017,
        event: "Tax Cuts and Jobs Act — largest US tax overhaul in decades",
        impact: "neutral",
      },
      {
        year: 2019,
        event: "First impeachment over Ukraine phone call",
        impact: "negative",
      },
      {
        year: 2021,
        event: "Jan 6 Capitol riot; second impeachment",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Assassination attempt; wins 2024 presidential election",
        impact: "neutral",
      },
      {
        year: 2025,
        event: "Returns to office; massive tariff agenda launched",
        impact: "neutral",
      },
    ],
    achievements: [
      "Abraham Accords — Israel–Arab normalisation",
      "First-term record stock market highs",
      "Operation Warp Speed COVID-19 vaccine program",
      "Historic peace talks with North Korea",
    ],
    politicalViews:
      "Economic nationalist, pro-tariff, anti-immigration, sceptical of multilateral institutions. America First foreign policy. Strong evangelical Christian base. Challenges mainstream media narratives.",
    approvalRating: 44,
    approvalTrend: "up",
    status: "In Office",
    impact:
      "Redefined Republican politics around populist nationalism. Two presidency arc makes him one of the most consequential and polarising modern US leaders.",
    region: "Americas",
  },
  {
    id: "xi",
    name: "Xi Jinping",
    country: "China",
    countryCode: "CN",
    flag: "🇨🇳",
    title: "General Secretary & President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Xi_Jinping_2019.jpg/440px-Xi_Jinping_2019.jpg",
    age: 71,
    birthYear: 1953,
    birthPlace: "Beijing, China",
    education: [
      {
        institution: "Tsinghua University",
        degree: "B.S. Chemical Engineering",
        year: 1979,
      },
      {
        institution: "Tsinghua University",
        degree: "Ph.D. Law (Marxist Theory)",
        year: 2002,
      },
    ],
    party: "Chinese Communist Party",
    ideology: "Communist",
    termsInOffice: [{ from: 2013, to: "present" }],
    background:
      "Spent formative years as a sent-down youth in rural Shaanxi during the Cultural Revolution. Rose through provincial party ranks before becoming one of the most powerful Chinese leaders since Mao Zedong, abolishing presidential term limits in 2018.",
    significantEvents: [
      {
        year: 2013,
        event:
          "Belt and Road Initiative launched — $1T global infrastructure project",
        impact: "neutral",
      },
      {
        year: 2017,
        event: "Xi Jinping Thought enshrined in Communist Party constitution",
        impact: "neutral",
      },
      {
        year: 2019,
        event: "Hong Kong crackdown; National Security Law 2020",
        impact: "negative",
      },
      {
        year: 2020,
        event:
          "China&#39;s COVID-19 handling — initial suppression then zero-COVID",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Brokered Saudi–Iran normalisation deal",
        impact: "positive",
      },
    ],
    achievements: [
      "Lifted 800M+ people from poverty (party data)",
      "Made China world&#39;s largest EV & solar manufacturer",
      "Belt and Road: infrastructure across 140+ countries",
      "Consolidated military modernisation — largest navy by hulls",
    ],
    politicalViews:
      "Marxist-Leninist with Chinese characteristics. Advocates CCP supremacy, national rejuvenation ('Chinese Dream'), reunification with Taiwan, and multipolarity against US hegemony.",
    approvalRating: 80,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed China into a global superpower challenger. His tenure defines a new era of US–China competition and reshapes global trade, technology, and security structures.",
    region: "Asia-Pacific",
  },
  {
    id: "putin",
    name: "Vladimir Putin",
    country: "Russia",
    countryCode: "RU",
    flag: "🇷🇺",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Vladimir_Putin_%282023-02-21%29.jpg/440px-Vladimir_Putin_%282023-02-21%29.jpg",
    age: 72,
    birthYear: 1952,
    birthPlace: "Leningrad (St. Petersburg), Russia",
    education: [
      {
        institution: "Leningrad State University",
        degree: "Law Degree",
        year: 1975,
      },
      {
        institution: "St. Petersburg Mining Institute",
        degree: "Candidate of Economic Sciences (PhD equivalent)",
        year: 1997,
      },
    ],
    party: "United Russia (informal)",
    ideology: "Nationalist",
    termsInOffice: [
      { from: 2000, to: 2008 },
      { from: 2012, to: "present" },
    ],
    background:
      "Former KGB intelligence officer who rose to power during the chaotic post-Soviet 1990s. Has dominated Russian politics for over two decades, transitioning Russia toward authoritarian state capitalism.",
    significantEvents: [
      {
        year: 2008,
        event: "Russo–Georgian War — South Ossetia and Abkhazia recognised",
        impact: "negative",
      },
      {
        year: 2014,
        event: "Annexation of Crimea; Donbas separatist conflict begins",
        impact: "negative",
      },
      {
        year: 2020,
        event: "Constitutional amendments allowing rule until 2036",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Full-scale invasion of Ukraine — major international consequences",
        impact: "negative",
      },
      {
        year: 2024,
        event: "ICC arrest warrant issued; re-elected in watched election",
        impact: "negative",
      },
    ],
    achievements: [
      "Stabilised Russia&#39;s economy after 1990s collapse",
      "Rebuilt Russian military into modern force",
      "Led Russia out of 1998 debt default through energy revenues",
      "Maintained strong domestic approval across 25 years",
    ],
    politicalViews:
      "Sovereign democracy, Russian nationalism, Orthodox Christianity as cultural pillar. Anti-NATO expansion, Pan-Slavic interest sphere, multipolar world order opposing US unipolarity.",
    approvalRating: 83,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Reshaped Europe&#39;s security architecture through Ukraine invasion. Faces unprecedented Western sanctions while pivoting Russia toward China and the Global South.",
    region: "Europe",
  },
  {
    id: "modi",
    name: "Narendra Modi",
    country: "India",
    countryCode: "IN",
    flag: "🇮🇳",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Narendra_Modi_2023.jpg/440px-Narendra_Modi_2023.jpg",
    age: 74,
    birthYear: 1950,
    birthPlace: "Vadnagar, Gujarat, India",
    education: [
      {
        institution: "Delhi University (School of Open Learning)",
        degree: "B.A. Political Science",
        year: 1978,
      },
      {
        institution: "Gujarat University",
        degree: "M.A. Political Science",
        year: 1983,
      },
    ],
    party: "Bharatiya Janata Party (BJP)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2014, to: "present" }],
    background:
      "Rose from humble origins as a tea seller to become Chief Minister of Gujarat for 13 years before leading BJP to a historic 2014 landslide. Known for digital governance initiatives and Hindu nationalist policies.",
    significantEvents: [
      {
        year: 2016,
        event: "Demonetisation of ₹500 & ₹1000 notes — disrupted cash economy",
        impact: "negative",
      },
      {
        year: 2019,
        event:
          "Revocation of Article 370 — Kashmir&#39;s special status removed",
        impact: "neutral",
      },
      {
        year: 2020,
        event: "Citizenship Amendment Act protests; COVID-19 handling",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "India hosts G20 Presidency; Chandrayaan-3 lunar south pole success",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Won third consecutive term; BJP lost outright majority",
        impact: "neutral",
      },
    ],
    achievements: [
      "Jan Dhan Yojana — 500M+ bank accounts for unbanked",
      "Aadhaar biometric ID system scaled to 1.3B+ people",
      "Make in India & PLI schemes attracting manufacturing",
      "India becomes 5th largest economy under his tenure",
    ],
    politicalViews:
      "Hindu nationalism (Hindutva), economic liberalisation, strong military posture toward Pakistan/China. Advocates India as a Vishwaguru (world leader). Non-aligned but pro-West tech ties.",
    approvalRating: 62,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Positioned India as indispensable swing state in global geopolitics. Balances ties with US, Russia, and China while pushing India&#39;s emergence as a major manufacturing and tech hub.",
    region: "Asia-Pacific",
  },
  {
    id: "macron",
    name: "Emmanuel Macron",
    country: "France",
    countryCode: "FR",
    flag: "🇫🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Emmanuel_Macron_in_2019.jpg/440px-Emmanuel_Macron_in_2019.jpg",
    age: 46,
    birthYear: 1977,
    birthPlace: "Amiens, France",
    education: [
      {
        institution: "Sciences Po Paris",
        degree: "M.A. Public Affairs",
        year: 2001,
      },
      {
        institution: "École Nationale d&#39;Administration (ENA)",
        degree: "Civil Service Elite Graduate",
        year: 2004,
      },
    ],
    party: "Renaissance (En Marche)",
    ideology: "Centrist",
    termsInOffice: [{ from: 2017, to: "present" }],
    background:
      "Former investment banker at Rothschild who served as Economy Minister under Hollande before founding his own movement En Marche and winning the presidency at 39 — the youngest French president in history.",
    significantEvents: [
      {
        year: 2018,
        event: "Gilets Jaunes (Yellow Vest) protests — weeks of civil unrest",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Pension reform raises retirement age to 64; mass protests",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Called snap elections after EU vote losses; lost parliamentary majority",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Paris Olympics successfully hosted",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Pushed EU unity on Ukraine sanctions and arms supply",
        impact: "positive",
      },
    ],
    achievements: [
      "Revitalised France&#39;s EU leadership role",
      "Tech & green investment via France 2030 plan",
      "European Strategic Autonomy concept championed",
      "Successful Notre-Dame de Paris restoration",
    ],
    politicalViews:
      "Pro-European federalism, liberal economics, secular republicanism (laïcité). Advocates EU strategic autonomy from both US and China. Supports nuclear energy as climate tool.",
    approvalRating: 26,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Has kept France central to EU decision-making and Ukraine war response, but faces serious domestic political fragmentation after losing his parliamentary majority.",
    region: "Europe",
  },
  {
    id: "scholz",
    name: "Olaf Scholz",
    country: "Germany",
    countryCode: "DE",
    flag: "🇩🇪",
    title: "Chancellor",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/2023_Olaf_Scholz.jpg/440px-2023_Olaf_Scholz.jpg",
    age: 66,
    birthYear: 1958,
    birthPlace: "Osnabrück, Germany",
    education: [
      {
        institution: "University of Hamburg",
        degree: "First State Exam in Law",
        year: 1985,
      },
      {
        institution: "University of Hamburg",
        degree: "Second State Exam (Bar)",
        year: 1988,
      },
    ],
    party: "Social Democratic Party (SPD)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2021, to: 2025 }],
    background:
      "Long-serving Hamburg politician and Finance Minister before becoming Chancellor. Led the traffic-light coalition with FDP and Greens. Lost the February 2025 snap elections to Friedrich Merz&#39;s CDU/CSU following coalition collapse.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Zeitenwende — historic €100B defence budget announced post-Ukraine invasion",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Germany&#39;s gas crisis; LNG terminals built at record speed",
        impact: "neutral",
      },
      {
        year: 2023,
        event: "Coalition collapse avoided despite budget crisis with FDP",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Coalition falls apart; snap elections called for Feb 2025",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "CDU/CSU wins snap elections; Scholz leaves office after one term",
        impact: "negative",
      },
    ],
    achievements: [
      "Managed Germany&#39;s energy transition from Russian gas",
      "G7 Ukraine financial support framework leadership",
      "€200B domestic energy subsidy shield",
      "Maintained social stability during energy shock",
    ],
    politicalViews:
      "Social democratic centre-left. Pro-European, cautious on military deployments, welfare-state defence, strong workers&#39; rights, gradual green transition. More sceptical of deep defence commitments than allies.",
    approvalRating: 20,
    approvalTrend: "down",
    status: "Former",
    impact:
      "Guided Germany through its most difficult energy and security crisis since WWII, though rising far-right support and coalition collapse mark a troubled domestic legacy.",
    region: "Europe",
  },
  {
    id: "sunak",
    name: "Rishi Sunak",
    country: "United Kingdom",
    countryCode: "GB",
    flag: "🇬🇧",
    title: "Former Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Rishi_Sunak_Cabinet_Portrait.jpg/440px-Rishi_Sunak_Cabinet_Portrait.jpg",
    age: 44,
    birthYear: 1980,
    birthPlace: "Southampton, Hampshire, UK",
    education: [
      {
        institution: "Winchester College",
        degree: "Secondary Education",
        year: 1998,
      },
      {
        institution: "University of Oxford (Lincoln College)",
        degree: "B.A. Philosophy, Politics & Economics",
        year: 2001,
      },
      {
        institution: "Stanford Graduate School of Business",
        degree: "MBA",
        year: 2006,
      },
    ],
    party: "Conservative Party",
    ideology: "Conservative",
    termsInOffice: [{ from: 2022, to: 2024 }],
    background:
      "Former Goldman Sachs analyst and hedge fund manager who served as Chancellor of the Exchequer before becoming the UK&#39;s first British-Asian Prime Minister in 2022. Lost the 2024 general election in a landslide to Labour.",
    significantEvents: [
      {
        year: 2022,
        event: "Became UK&#39;s first British-Asian PM — historic milestone",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Struck the Windsor Framework on NI&#39;s Brexit arrangements",
        impact: "positive",
      },
      {
        year: 2023,
        event: "UK joins CPTPP — first new free trade bloc post-Brexit",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Labour wins historic landslide; Conservatives suffer worst defeat in history",
        impact: "negative",
      },
    ],
    achievements: [
      "Windsor Framework resolved Northern Ireland Brexit impasse",
      "CPTPP accession — UK&#39;s largest post-Brexit trade deal",
      "Maintained UK support for Ukraine",
      "Halved UK inflation from 11% to ~2% during tenure",
    ],
    politicalViews:
      "Traditional fiscal conservative. Pro-free trade, low tax, deregulation. Strong on national security. More interventionist than Thatcher on energy/tech industrial policy.",
    approvalRating: 22,
    approvalTrend: "down",
    status: "Former",
    impact:
      "Cut short by historic 2024 Labour landslide. Legacy includes Windsor Framework and CPTPP but overshadowed by perception of broken promises on tax and NHS.",
    region: "Europe",
  },
  {
    id: "starmer",
    name: "Keir Starmer",
    country: "United Kingdom",
    countryCode: "GB",
    flag: "🇬🇧",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Keir_Starmer_2020.jpg/440px-Keir_Starmer_2020.jpg",
    age: 61,
    birthYear: 1962,
    birthPlace: "Southwark, London, UK",
    education: [
      { institution: "University of Leeds", degree: "B.A. Law", year: 1985 },
      {
        institution: "St Edmund Hall, Oxford",
        degree: "B.C.L. (Bachelor of Civil Law)",
        year: 1987,
      },
    ],
    party: "Labour Party",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Former Director of Public Prosecutions (2008–2013) and human rights lawyer who led Labour back to power in a historic 2024 landslide after 14 years in opposition.",
    significantEvents: [
      {
        year: 2024,
        event: "Labour wins largest parliamentary majority in decades",
        impact: "positive",
      },
      {
        year: 2024,
        event: "GB Energy national clean power company created",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Took action on inheritance tax on farms — provoked farmer protests",
        impact: "negative",
      },
      {
        year: 2025,
        event: "UK–EU reset negotiations; defence pact discussions",
        impact: "positive",
      },
    ],
    achievements: [
      "Historic 2024 election win — 400+ seats for Labour",
      "GB Energy founded to own clean energy assets",
      "National Wealth Fund established for industrial investment",
      "Workers&#39; Rights Bill — biggest labour reform in decades",
    ],
    politicalViews:
      "Centre-left pragmatist. Pro-European cooperation without re-joining EU. Climate mission, NHS investment, workers&#39; rights, national wealth fund. Hawkish on crime; international rules-based order.",
    approvalRating: 28,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Early approval rating declines despite large majority. Ambitious domestic agenda faces headwinds from inherited fiscal constraints and public discontent with pace of change.",
    region: "Europe",
  },
  {
    id: "zelensky",
    name: "Volodymyr Zelensky",
    country: "Ukraine",
    countryCode: "UA",
    flag: "🇺🇦",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Volodymyr_Zelensky_Official_2022.jpg/440px-Volodymyr_Zelensky_Official_2022.jpg",
    age: 46,
    birthYear: 1978,
    birthPlace: "Kryvyi Rih, Ukrainian SSR (now Ukraine)",
    education: [
      {
        institution: "Kyiv National Economic University",
        degree: "Law Degree",
        year: 2000,
      },
    ],
    party: "Servant of the People (Слуга Народу)",
    ideology: "Centrist",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Actor and comedian famous for playing the President in a TV show titled 'Servant of the People' — before winning the real presidency in 2019 with 73% of the vote. Became a wartime symbol of Ukrainian resistance after refusing evacuation in February 2022.",
    significantEvents: [
      {
        year: 2019,
        event: "Elected President with unprecedented 73% of vote",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Russia invades — stays in Kyiv: 'I need ammunition, not a ride'",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Rallied Western military and financial support for Ukraine",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Summer counteroffensive falls short of strategic goals",
        impact: "negative",
      },
      {
        year: 2024,
        event: "NATO membership talks accelerated; peace negotiations restart",
        impact: "neutral",
      },
    ],
    achievements: [
      "Kept Ukraine fighting and unified against full-scale invasion",
      "Secured $175B+ in international military and financial aid",
      "NATO candidate status and EU membership candidacy achieved",
      "Time Person of the Year 2022",
    ],
    politicalViews:
      "Pro-European, pro-NATO integration. Anti-corruption reformer. Democratic values, rule of law, wartime nationalism. Pragmatic — willing to make territorial concessions for peace if security guarantees met.",
    approvalRating: 57,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "Transformed from comedian-politician to global symbol of democratic resistance. His leadership has kept Ukraine in the fight but at extraordinary human cost.",
    region: "Europe",
  },
  {
    id: "mbs",
    name: "Mohammed bin Salman",
    country: "Saudi Arabia",
    countryCode: "SA",
    flag: "🇸🇦",
    title: "Crown Prince & Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Crown_Prince_Mohammad_bin_Salman_Al_Saud_-_2020.jpg/440px-Crown_Prince_Mohammad_bin_Salman_Al_Saud_-_2020.jpg",
    age: 39,
    birthYear: 1985,
    birthPlace: "Riyadh, Saudi Arabia",
    education: [
      { institution: "King Saud University", degree: "B.A. Law", year: 2007 },
    ],
    party: "House of Saud (monarchy)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2017, to: "present" }],
    background:
      "Known as MBS, emerged as de facto ruler of Saudi Arabia by sidelining rivals and consolidating power. Youngest defence minister in the world at 29. Architect of Vision 2030 economic reform agenda.",
    significantEvents: [
      {
        year: 2017,
        event:
          "Anti-corruption purge — 200+ princes and businessmen detained at Ritz-Carlton",
        impact: "neutral",
      },
      {
        year: 2018,
        event: "Killing of journalist Jamal Khashoggi — UN attributed to MBS",
        impact: "negative",
      },
      {
        year: 2019,
        event: "Saudi Aramco IPO — world&#39;s largest at $1.7T valuation",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Saudi–Iran normalisation brokered by China",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Israel peace deal negotiations begin (paused by Gaza war)",
        impact: "neutral",
      },
    ],
    achievements: [
      "Women allowed to drive; entertainment sector opened",
      "NEOM $500B futuristic city project launched",
      "Saudi Aramco biggest IPO in history",
      "Diversified economy with $700B+ ARAMCO state revenue",
    ],
    politicalViews:
      "Absolute monarchist moderniser — social liberalisation domestically, but zero political opposition tolerated. Pro-business, anti-Iran, increasingly independent of US alignment. Leads OPEC+ oil strategy.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed Saudi society at breakneck speed while eliminating political rivals. His leadership will define the post-oil transition era for the world&#39;s most important energy exporter.",
    region: "Middle East",
  },
  {
    id: "lula",
    name: "Luiz Inácio Lula da Silva",
    country: "Brazil",
    countryCode: "BR",
    flag: "🇧🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Lula_-_foto_oficial_2023.jpg/440px-Lula_-_foto_oficial_2023.jpg",
    age: 79,
    birthYear: 1945,
    birthPlace: "Caetés, Pernambuco, Brazil",
    education: [
      {
        institution: "SENAI Technical School",
        degree: "Lathe Operator (Technical)",
        year: 1963,
      },
    ],
    party: "Workers&#39; Party (PT)",
    ideology: "Social Democrat",
    termsInOffice: [
      { from: 2003, to: 2011 },
      { from: 2023, to: "present" },
    ],
    background:
      "Former metalworker and trade union leader who served two terms as president lifting 30M Brazilians out of poverty. Jailed in 2018 on corruption charges later annulled. Won a dramatic 2022 comeback against Bolsonaro by 1.8%.",
    significantEvents: [
      {
        year: 2003,
        event: "Zero Hunger programme launched — 30M lifted from poverty",
        impact: "positive",
      },
      {
        year: 2018,
        event: "Jailed on corruption charges later annulled by Supreme Court",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Returned to presidency; reversed Amazon deforestation policies",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Jan 8 coup attempt by Bolsonaro supporters suppressed",
        impact: "positive",
      },
      {
        year: 2024,
        event: "G20 host; landmark global hunger and wealth inequality agenda",
        impact: "positive",
      },
    ],
    achievements: [
      "Lifted 30M+ Brazilians out of poverty in first terms",
      "Amazon deforestation cut by 50% in first year back",
      "G20 2024 declared Global Alliance Against Hunger",
      "Bolsa Família expanded — largest social transfer in LatAm",
    ],
    politicalViews:
      "Democratic socialist. Pro-poor economic redistribution, environmental protection, South–South cooperation, multilateralism. Sceptical of US foreign policy; close ties with China and Arab states.",
    approvalRating: 45,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "One of the most remarkable political comebacks in history. Leading a reinvigorated Brazil as a voice of the Global South at G20 and climate diplomacy forums.",
    region: "Americas",
  },
  {
    id: "kim",
    name: "Kim Jong-un",
    country: "North Korea",
    countryCode: "KP",
    flag: "🇰🇵",
    title: "Supreme Leader",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Kim_Jong-un_April_2019_%28cropped%29.jpg/440px-Kim_Jong-un_April_2019_%28cropped%29.jpg",
    age: 41,
    birthYear: 1983,
    birthPlace: "Pyongyang, North Korea",
    education: [
      {
        institution: "Kim Il-sung Military University",
        degree: "Military Studies",
        year: 2006,
      },
      {
        institution: "Kim Il-sung University",
        degree: "Physics (reported)",
        year: 2009,
      },
    ],
    party: "Korean Workers&#39; Party",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2011, to: "present" }],
    background:
      "Third-generation hereditary dictator who inherited power at ~27 after his father Kim Jong-il died. Educated in Switzerland under a pseudonym. Has overseen accelerated nuclear and missile development.",
    significantEvents: [
      {
        year: 2017,
        event: "Sixth nuclear test — largest in DPRK history; ICBM tested",
        impact: "negative",
      },
      {
        year: 2018,
        event: "Singapore Summit with Trump — historic but no lasting deal",
        impact: "neutral",
      },
      {
        year: 2020,
        event: "Closed borders completely during COVID — severe famine risk",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Military pact with Russia; North Korean troops in Ukraine",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Declared ROK as 'principal enemy'; renounced reunification goal",
        impact: "negative",
      },
    ],
    achievements: [
      "Operational ICBM capability — can reach continental US",
      "Solid-fuelled missile programme advanced",
      "Maintained regime stability despite sanctions and famines",
      "Elevated North Korea to significant geopolitical bargaining chip",
    ],
    politicalViews:
      "Juche (self-reliance ideology), Songun (military-first), hereditary totalitarianism. Absolute rejection of regime change or nuclear disarmament. Now aligns more openly with Russia and China.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Has brought North Korea closer to credible nuclear deterrent than any predecessor. The 2025 Russia–DPRK military axis marks a dangerous geopolitical shift.",
    region: "Asia-Pacific",
  },
  {
    id: "netanyahu",
    name: "Benjamin Netanyahu",
    country: "Israel",
    countryCode: "IL",
    flag: "🇮🇱",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Benjamin_Netanyahu_-_2012.jpg/440px-Benjamin_Netanyahu_-_2012.jpg",
    age: 74,
    birthYear: 1949,
    birthPlace: "Tel Aviv, Israel",
    education: [
      { institution: "MIT", degree: "B.S. Architecture", year: 1975 },
      {
        institution: "MIT Sloan School of Management",
        degree: "M.S. Management",
        year: 1976,
      },
    ],
    party: "Likud",
    ideology: "Conservative",
    termsInOffice: [
      { from: 1996, to: 1999 },
      { from: 2009, to: 2021 },
      { from: 2022, to: "present" },
    ],
    background:
      "Israel&#39;s longest-serving Prime Minister (cumulative). Former special forces officer who served in the Sayeret Matkal. Has dominated Israeli politics for three decades but faces ongoing corruption trial.",
    significantEvents: [
      {
        year: 2015,
        event: "Address to US Congress opposing Obama Iran nuclear deal",
        impact: "neutral",
      },
      {
        year: 2020,
        event:
          "Abraham Accords co-architect — normalisation with 4 Arab states",
        impact: "positive",
      },
      {
        year: 2023,
        event: "October 7 Hamas attack — worst day for Jews since Holocaust",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Gaza war — ICC arrest warrant issued",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Killed Hamas, Hezbollah, and Iranian leadership figures",
        impact: "neutral",
      },
    ],
    achievements: [
      "Abraham Accords: UAE, Bahrain, Sudan, Morocco normalised",
      "Iron Dome widely credited to his defence investment",
      "Israel&#39;s tech economy became Startup Nation globally",
      "Eliminated multiple top-tier adversary commanders",
    ],
    politicalViews:
      "Right-wing Zionist nationalist. Opposes Palestinian state. Pro-US alliance but independent actor. Hawk on Iran, pro-settlements, sceptical of any territorial compromise.",
    approvalRating: 32,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Longest-serving Israeli PM whose legacy is permanently shaped by the Oct 7 failure and the subsequent Gaza war — and its profound regional consequences.",
    region: "Middle East",
  },
  {
    id: "erdogan",
    name: "Recep Tayyip Erdoğan",
    country: "Turkey",
    countryCode: "TR",
    flag: "🇹🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Recep_Tayyip_Erdo%C4%9Fan_%28September_2019%29.jpg/440px-Recep_Tayyip_Erdo%C4%9Fan_%28September_2019%29.jpg",
    age: 70,
    birthYear: 1954,
    birthPlace: "Kasımpaşa, Istanbul, Turkey",
    education: [
      {
        institution: "Marmara University",
        degree: "B.S. Business Administration",
        year: 1981,
      },
    ],
    party: "Justice and Development Party (AKP)",
    ideology: "Populist",
    termsInOffice: [
      { from: 2014, to: "present" },
      { from: 2003, to: 2014 },
    ],
    background:
      "Rose from Islamist political party background, briefly jailed in 1999 for inciting religious hatred. Served as Istanbul mayor and Prime Minister before transitioning Turkey to presidential system in 2018.",
    significantEvents: [
      {
        year: 2016,
        event:
          "Failed coup attempt — used to consolidate power and purge 150K+ people",
        impact: "neutral",
      },
      {
        year: 2023,
        event: "Re-elected in high-stakes runoff despite record 85% inflation",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Turkey hit by 7.8 magnitude earthquake killing 50,000+",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Mediated Ukraine–Russia grain deal; significant diplomatic role",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Agreed to admit Sweden to NATO after concessions secured",
        impact: "neutral",
      },
    ],
    achievements: [
      "Turkey&#39;s GDP tripled during his rule",
      "Grain corridor deal between Ukraine and Russia",
      "TEKNOFEST aerospace and defence industry built nationally",
      "Bayraktar TB2 drone became globally significant weapon",
    ],
    politicalViews:
      "Conservative Islamic populism, Turkish nationalism, Neo-Ottomanism foreign policy. Uses NATO membership as leverage. Opposes Kurdish autonomy strongly. Pragmatic player between US, Russia, China.",
    approvalRating: 43,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed Turkey from a secular Kemalist state toward Islamic conservatism while leveraging strategic geography to make Turkey a key mediator in global conflicts.",
    region: "Europe",
  },
  {
    id: "meloni",
    name: "Giorgia Meloni",
    country: "Italy",
    countryCode: "IT",
    flag: "🇮🇹",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Giorgia_Meloni_2023.jpg/440px-Giorgia_Meloni_2023.jpg",
    age: 47,
    birthYear: 1977,
    birthPlace: "Rome, Italy",
    education: [
      {
        institution: "Amerigo Vespucci High School",
        degree: "Tourism Studies Diploma",
        year: 1996,
      },
    ],
    party: "Brothers of Italy (FdI)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Italy&#39;s first female Prime Minister and youngest person to hold the office. Rose through post-fascist party politics from age 15, becoming Youth Minister at 31. Her FdI party roots trace to the Italian Social Movement (MSI), a post-war neo-fascist party.",
    significantEvents: [
      {
        year: 2022,
        event: "FdI wins election; Meloni becomes first female Italian PM",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Albania migration deal — offshore processing agreement signed",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Continues to support Ukraine despite coalition tensions",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Re-elected as MEP while serving as PM; key EU figure",
        impact: "neutral",
      },
    ],
    achievements: [
      "First female Prime Minister in Italian history",
      "Italy&#39;s immigration deal with Albania as EU model",
      "Stabilised Italian government after years of instability",
      "Kept Italy in Ukraine support coalition despite far-right roots",
    ],
    politicalViews:
      "National conservative, pro-family, anti-immigration, sovereignty-focused. Evolved from Eurosceptic to pragmatic EU partner. Hawkish on China, supportive of NATO and US alliance under Trump.",
    approvalRating: 48,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Defied expectations of populist chaos, delivering stable governance while reshaping Italy&#39;s role in EU migration policy and positioning Rome as a key Washington ally.",
    region: "Europe",
  },
  {
    id: "sheinbaum",
    name: "Claudia Sheinbaum",
    country: "Mexico",
    countryCode: "MX",
    flag: "🇲🇽",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Claudia_Sheinbaum_2024_%28cropped%29.jpg/440px-Claudia_Sheinbaum_2024_%28cropped%29.jpg",
    age: 62,
    birthYear: 1962,
    birthPlace: "Mexico City, Mexico",
    education: [
      {
        institution: "National Autonomous University of Mexico (UNAM)",
        degree: "B.S. Physics",
        year: 1989,
      },
      {
        institution: "UNAM",
        degree: "Ph.D. Environmental Engineering",
        year: 1995,
      },
    ],
    party: "MORENA",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Climate scientist and IPCC contributor who served as Mexico City mayor (2018–2023) before winning the 2024 presidential election with a record 59% of the vote — Mexico&#39;s first female president and first with a science doctorate.",
    significantEvents: [
      {
        year: 2024,
        event: "Elected Mexico&#39;s first female president by historic margin",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Inherited AMLO&#39;s controversial judicial reform — 2,500+ judges up for public vote",
        impact: "negative",
      },
      {
        year: 2025,
        event: "US–Mexico trade war tensions over Trump tariffs",
        impact: "negative",
      },
      {
        year: 2025,
        event: "Launched National Security Plan against cartels",
        impact: "neutral",
      },
    ],
    achievements: [
      "First female president in Mexico&#39;s 200-year history",
      "Former IPCC co-author on climate change",
      "Reduced Mexico City&#39;s carbon emissions as mayor",
      "Expanded public transit and cycling infrastructure in CDMX",
    ],
    politicalViews:
      "Centre-left, pro-social welfare, nationalist on energy (state-owned Pemex and CFE), climate-conscious. Continuity with AMLO&#39;s Morena agenda but with more technocratic approach.",
    approvalRating: 71,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Historic presidency reshaping Mexico&#39;s identity. Faces the tightest US–Mexico relationship since NAFTA as she navigates Trump&#39;s trade and immigration pressures.",
    region: "Americas",
  },
  {
    id: "albanese",
    name: "Anthony Albanese",
    country: "Australia",
    countryCode: "AU",
    flag: "🇦🇺",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Anthony_Albanese_2022.jpg/440px-Anthony_Albanese_2022.jpg",
    age: 62,
    birthYear: 1963,
    birthPlace: "Camperdown, New South Wales, Australia",
    education: [
      {
        institution: "University of Sydney",
        degree: "B.Ec. Economics",
        year: 1984,
      },
    ],
    party: "Australian Labor Party (ALP)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Raised by a single mother on welfare in a Housing Commission flat in Sydney. Worked his way up through Labor party ranks over 26 years in parliament. Won the 2022 election ending nine years of Liberal-National coalition government.",
    significantEvents: [
      {
        year: 2022,
        event: "Labor wins election; ends decade of Liberal rule",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Voice to Parliament referendum defeated despite Albanese&#39;s support",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Australia signs AUKUS nuclear submarine deal — enhanced US/UK alliance",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Restored Australia–China diplomatic relations and trade",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Re-elected for second term in May 2025 election",
        impact: "positive",
      },
    ],
    achievements: [
      "Net Zero 2050 target legislated in National Climate Act",
      "AUKUS submarine acquisition pathway confirmed",
      "Restored $20B+ in Chinese trade after diplomatic freeze",
      "National Anti-Corruption Commission established",
    ],
    politicalViews:
      "Centre-left social democrat. Pro-climate action, pro-AUKUS alliance, pro-Indigenous recognition. Multilateralist — pushes Australia&#39;s middle-power role in Indo-Pacific while balancing US and China.",
    approvalRating: 49,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Reshaped Australia&#39;s foreign policy by repairing China relations while deepening AUKUS defence ties. Domestic legacy mixed after failed Voice referendum.",
    region: "Asia-Pacific",
  },
  {
    id: "ramaphosa",
    name: "Cyril Ramaphosa",
    country: "South Africa",
    countryCode: "ZA",
    flag: "🇿🇦",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Cyril_Ramaphosa_2018_%28cropped%29.jpg/440px-Cyril_Ramaphosa_2018_%28cropped%29.jpg",
    age: 72,
    birthYear: 1952,
    birthPlace: "Soweto, Johannesburg, South Africa",
    education: [
      {
        institution: "University of the North (now University of Limpopo)",
        degree: "B.Proc. Law",
        year: 1981,
      },
    ],
    party: "African National Congress (ANC)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2018, to: "present" }],
    background:
      "Former anti-apartheid activist, NUM trade union leader, and key negotiator in South Africa&#39;s democratic transition. Became a billionaire businessman before returning to politics. Replaced Jacob Zuma after corruption scandal.",
    significantEvents: [
      {
        year: 2018,
        event: "Replaced Zuma as President after ANC corruption crisis",
        impact: "positive",
      },
      {
        year: 2021,
        event: "Zuma jailing triggers deadly unrest — 300+ killed in KZN riots",
        impact: "negative",
      },
      {
        year: 2023,
        event: "BRICS expanded under South Africa&#39;s chairmanship",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "ANC loses parliamentary majority for first time since 1994",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Government of National Unity formed across party lines",
        impact: "positive",
      },
    ],
    achievements: [
      "Ended Zuma-era state capture; launched anti-corruption inquiries",
      "Steered South Africa&#39;s post-COVID economic recovery",
      "BRICS 2023 chair; expanded bloc to include 6 nations",
      "Government of National Unity — historic post-ANC majority deal",
    ],
    politicalViews:
      "Pan-African, non-aligned foreign policy. Social democratic economics — supports land reform without Zimbabwe-style expropriation. Pro-BRICS, pro-African Union, cautious on Ukraine war alignment.",
    approvalRating: 41,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Navigated South Africa&#39;s most significant political transition since Mandela, forming the first GNU in 30 years after the ANC&#39;s historic loss of its parliamentary majority.",
    region: "Africa",
  },
  {
    id: "khan",
    name: "Shehbaz Sharif",
    country: "Pakistan",
    countryCode: "PK",
    flag: "🇵🇰",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Shehbaz_Sharif_in_2022.jpg/440px-Shehbaz_Sharif_in_2022.jpg",
    age: 73,
    birthYear: 1951,
    birthPlace: "Lahore, Pakistan",
    education: [
      {
        institution: "Government College University",
        degree: "B.A. Economics",
        year: 1974,
      },
    ],
    party: "Pakistan Muslim League – Nawaz (PML-N)",
    ideology: "Conservative",
    termsInOffice: [
      { from: 2022, to: 2023 },
      { from: 2024, to: "present" },
    ],
    background:
      "Younger brother of three-time PM Nawaz Sharif. Served as Chief Minister of Punjab for 13 years, earning a reputation as a doer and administrator. Became PM after Imran Khan&#39;s ouster via no-confidence vote in 2022 and again after disputed 2024 elections.",
    significantEvents: [
      {
        year: 2022,
        event: "Replaced Imran Khan via no-confidence motion",
        impact: "neutral",
      },
      {
        year: 2023,
        event: "Secured $3B IMF bailout averting Pakistan default",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Won disputed election amid claims of vote manipulation",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "India–Pakistan military escalation: Operation Sindoor cross-border strikes",
        impact: "negative",
      },
    ],
    achievements: [
      "IMF bailout secured — prevented sovereign default",
      "Managed Punjab&#39;s infrastructure for over a decade",
      "Reduced Pakistan&#39;s energy circular debt partially",
      "Maintained China–Pakistan Economic Corridor (CPEC) investments",
    ],
    politicalViews:
      "Business-friendly conservative, pro-China CPEC investment, cautious on India relations. Pragmatic — willing to work with military establishment. Fiscal tightening under IMF conditionality.",
    approvalRating: 29,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Governing a deeply fractured Pakistan under IMF austerity with Imran Khan jailed and the military as kingmaker. The 2025 India–Pakistan crisis defines his most dangerous moment in office.",
    region: "Asia-Pacific",
  },
  {
    id: "milei",
    name: "Javier Milei",
    country: "Argentina",
    countryCode: "AR",
    flag: "🇦🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Javier_Milei_2023_%28cropped%29.jpg/440px-Javier_Milei_2023_%28cropped%29.jpg",
    age: 54,
    birthYear: 1970,
    birthPlace: "Palermo, Buenos Aires, Argentina",
    education: [
      {
        institution: "Universidad de Belgrano",
        degree: "B.A. Economics",
        year: 1994,
      },
      {
        institution: "Universidad Torcuato Di Tella",
        degree: "M.A. Economics",
        year: 1996,
      },
    ],
    party: "La Libertad Avanza",
    ideology: "Liberal",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Former TV political commentator and economist who became Argentina&#39;s most disruptive political outsider. Known for wielding a chainsaw at rallies as a symbol of state cuts. Won 2023 election with 56% promising radical libertarian shock therapy to end Argentina&#39;s repeat economic crises.",
    significantEvents: [
      {
        year: 2023,
        event:
          "Elected president; promises to dollarise economy and abolish central bank",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Slashed public spending by 30% — achieved Argentina&#39;s first surplus in 16 years",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Devalued peso 54% overnight; inflation spiked to 211%",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "IMF praised Argentina&#39;s fiscal consolidation — new $20B deal",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Approval rating held above 50% despite severe austerity",
        impact: "positive",
      },
    ],
    achievements: [
      "First fiscal surplus in 16 years achieved in 2024",
      "Monthly inflation fell from 25% (Dec 2023) to under 3% (2025)",
      "IMF secured $20B programme — largest in IMF history",
      "Deregulation of economy — removed hundreds of price controls",
    ],
    politicalViews:
      "Anarcho-capitalist libertarian. Abolish central bank, dollarise economy, slash state to minimum, privatise public companies. Anti-socialist, anti-feminist, climate sceptic. Aligns with Trump and Israel. Quotes Mises and Hayek obsessively.",
    approvalRating: 52,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Most radical economic experiment in modern Latin American history. If successful, becomes a global proof-of-concept for hard libertarian austerity. If it fails, Argentina risks another debt collapse.",
    region: "Americas",
  },
  {
    id: "carney",
    name: "Mark Carney",
    country: "Canada",
    countryCode: "CA",
    flag: "🇨🇦",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Mark_Carney_on_June_18%2C_2018.jpg/440px-Mark_Carney_on_June_18%2C_2018.jpg",
    age: 59,
    birthYear: 1965,
    birthPlace: "Fort Smith, Northwest Territories, Canada",
    education: [
      {
        institution: "Harvard University",
        degree: "B.A. Economics",
        year: 1988,
      },
      {
        institution: "University of Oxford",
        degree: "M.Phil. & D.Phil. Economics",
        year: 1995,
      },
    ],
    party: "Liberal Party of Canada",
    ideology: "Centrist",
    termsInOffice: [{ from: 2025, to: "present" }],
    background:
      "Former Governor of both the Bank of Canada (2008–2013) and Bank of England (2013–2020) — the only person to have led two G7 central banks. Won Liberal Party leadership in January 2025 after Trudeau resigned, then won the April 2025 federal election amid US tariff crisis.",
    significantEvents: [
      {
        year: 2008,
        event: "Led Bank of Canada through 2008 global financial crisis",
        impact: "positive",
      },
      {
        year: 2013,
        event: "Became first foreign Governor of the Bank of England",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Won Liberal leadership amid Trudeau resignation",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Won federal election — ran on anti-Trump sovereignty platform",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Immediate tariff negotiations with Trump administration",
        impact: "neutral",
      },
    ],
    achievements: [
      "Guided Canada through 2008 financial crisis with minimal damage",
      "First foreign-born Bank of England Governor in 300+ years",
      "Led TCFD — global framework for climate financial risk disclosure",
      "Won federal election largely on defending Canadian sovereignty",
    ],
    politicalViews:
      "Centre-left liberal, pro-multilateral institutions, strong climate finance advocate. Balances free trade with industrial policy. Determined to maintain Canadian economic independence from US pressure.",
    approvalRating: 48,
    approvalTrend: "up",
    status: "In Office",
    impact:
      "Taking power at the most fraught moment in Canada–US relations since NAFTA negotiations. His central bank credibility is his greatest asset in managing Trump&#39;s trade war.",
    region: "Americas",
  },
  {
    id: "ishiba",
    name: "Shigeru Ishiba",
    country: "Japan",
    countryCode: "JP",
    flag: "🇯🇵",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Shigeru_Ishiba_20241001.jpg/440px-Shigeru_Ishiba_20241001.jpg",
    age: 67,
    birthYear: 1957,
    birthPlace: "Tokyo, Japan",
    education: [
      { institution: "Keio University", degree: "B.A. Law", year: 1979 },
    ],
    party: "Liberal Democratic Party (LDP)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Former banker at Mitsui Bank who entered politics in 1986. Veteran defence policy expert known as a plain-spoken maverick within the LDP. Ran for LDP leadership five times before finally winning in September 2024, succeeding Fumio Kishida.",
    significantEvents: [
      {
        year: 2024,
        event: "Won LDP leadership race on fifth attempt; became PM",
        impact: "positive",
      },
      {
        year: 2024,
        event: "LDP loses lower house majority — first in 15 years",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Japan&#39;s defence budget raised to 2% of GDP — historic shift",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "US–Japan tariff negotiations under Trump&#39;s 24% tariff threat",
        impact: "negative",
      },
    ],
    achievements: [
      "Pushed Japan&#39;s defence budget to NATO-level 2% of GDP",
      "Advanced Japan&#39;s counterstrike capability doctrine",
      "Promoted transparent LDP party reform after slush fund scandal",
      "Maintained Japan&#39;s security alliance with US under pressure",
    ],
    politicalViews:
      "Conservative nationalist, strong US alliance advocate but also interested in an Asian NATO concept. Pro-defence spending increase. Willing to break from LDP taboos — has discussed nuclear sharing debate openly.",
    approvalRating: 35,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Leads Japan through its most significant military expansion since WWII while navigating coalition politics after losing the LDP&#39;s lower house majority.",
    region: "Asia-Pacific",
  },
  {
    id: "sanchez",
    name: "Pedro Sánchez",
    country: "Spain",
    countryCode: "ES",
    flag: "🇪🇸",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Pedro_S%C3%A1nchez_2020_%28cropped%29.jpg/440px-Pedro_S%C3%A1nchez_2020_%28cropped%29.jpg",
    age: 52,
    birthYear: 1972,
    birthPlace: "Madrid, Spain",
    education: [
      {
        institution: "Complutense University of Madrid",
        degree: "B.A. Economics",
        year: 1995,
      },
      {
        institution: "Camilo José Cela University",
        degree: "Ph.D. Economics",
        year: 2012,
      },
    ],
    party: "Spanish Socialist Workers&#39; Party (PSOE)",
    ideology: "Social Democrat",
    termsInOffice: [
      { from: 2018, to: 2019 },
      { from: 2019, to: "present" },
    ],
    background:
      "Overcame his own party&#39;s ouster to return as PSOE leader and PM — earning the nickname 'Pedro el Resistente'. Governs in a fragile coalition dependent on Catalan separatist and far-left parties. PhD in economics; one of the most academically qualified EU leaders.",
    significantEvents: [
      {
        year: 2020,
        event: "Led Spain through worst COVID death toll in Europe initially",
        impact: "negative",
      },
      {
        year: 2021,
        event: "Spain&#39;s EU recovery fund — €140B secured",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Won fragile majority using Catalan amnesty law — massive protests",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Recognised Palestinian statehood — first major EU state",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Nearly resigned after wife investigated for corruption allegations",
        impact: "negative",
      },
    ],
    achievements: [
      "Spain&#39;s GDP grew fastest of major EU economies in 2023–24",
      "Euthanasia and gender-affirming care legalised",
      "EU Recovery Fund champion — largest in Spanish history",
      "Raised minimum wage by 54% since taking office",
    ],
    politicalViews:
      "Centre-left social democratic, pro-European federalism, progressive social agenda. Supports Palestinian statehood, climate action, expanded welfare state. Politically flexible — willing to make deals with separatists and radical left to stay in power.",
    approvalRating: 37,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Master of political survival who has kept power through a patchwork of unlikely alliances. Spain&#39;s economy is Europe&#39;s growth outperformer under his tenure, even as institutional trust erodes.",
    region: "Europe",
  },
  {
    id: "bukele",
    name: "Nayib Bukele",
    country: "El Salvador",
    countryCode: "SV",
    flag: "🇸🇻",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Nayib_Bukele_2024_%28cropped%29.jpg/440px-Nayib_Bukele_2024_%28cropped%29.jpg",
    age: 43,
    birthYear: 1981,
    birthPlace: "San Salvador, El Salvador",
    education: [
      {
        institution: "José Matías Delgado University",
        degree: "Law (incomplete)",
        year: 2001,
      },
    ],
    party: "Nuevas Ideas",
    ideology: "Populist",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Former mayor of Nuevo Cuscatlán and San Salvador who founded his own party and won the presidency at 37. Became globally famous for his Bitcoin experiment and radical anti-gang crackdown that turned El Salvador from murder capital of the world to one of Central America&#39;s safest countries — though at serious civil liberties cost.",
    significantEvents: [
      {
        year: 2021,
        event:
          "El Salvador adopts Bitcoin as legal tender — first country in the world",
        impact: "neutral",
      },
      {
        year: 2022,
        event: "State of Exception declared — 75,000+ gang members arrested",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Homicide rate fell 70% — El Salvador no longer murder capital of world",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Won re-election with 85% — unprecedented in salvadoran history",
        impact: "positive",
      },
      {
        year: 2024,
        event: "CECOT mega-prison opened, housing 40,000+ gang inmates",
        impact: "neutral",
      },
    ],
    achievements: [
      "Homicide rate cut from 106 to under 2 per 100,000 in 3 years",
      "First sovereign nation to adopt Bitcoin as legal tender",
      "Tourism revenue tripled as safety perception improved dramatically",
      "Won re-election with record 85% majority",
    ],
    politicalViews:
      "Populist authoritarian technocrat. Pro-Bitcoin and crypto-innovation, iron-fist anti-crime, dismissive of judicial independence and press freedom. Positions himself as outside left–right spectrum. Anti-gang absolutist.",
    approvalRating: 91,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Created the most dramatic crime reduction in modern Latin American history. Became a model debated worldwide — balancing extraordinary public safety gains against documented mass arbitrary detention and suppressed civil liberties.",
    region: "Americas",
  },
  {
    id: "prabowo",
    name: "Prabowo Subianto",
    country: "Indonesia",
    countryCode: "ID",
    flag: "🇮🇩",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Prabowo_Subianto_2024_official_portrait.jpg/440px-Prabowo_Subianto_2024_official_portrait.jpg",
    age: 73,
    birthYear: 1951,
    birthPlace: "Jakarta, Indonesia",
    education: [
      {
        institution: "Indonesian Military Academy (AKABRI)",
        degree: "Military Studies",
        year: 1974,
      },
      {
        institution: "US Army Command and General Staff College",
        degree: "Advanced Military Studies",
        year: 1985,
      },
    ],
    party: "Gerindra (Greater Indonesia Movement)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Former Army Special Forces commander and son-in-law of dictator Suharto. After two failed presidential bids in 2014 and 2019 — and allegations of human rights abuses in East Timor — formed an alliance with outgoing President Jokowi&#39;s son and won the 2024 election with 58% of the vote.",
    significantEvents: [
      {
        year: 1998,
        event:
          "Accused of ordering kidnappings of pro-democracy activists during Suharto era",
        impact: "negative",
      },
      {
        year: 2014,
        event: "Lost first presidential election to Joko Widodo",
        impact: "negative",
      },
      {
        year: 2019,
        event:
          "Lost second presidential bid; post-election protests turned violent",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Won presidency with 58% — third attempt success",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Launched 3M free meals programme for schoolchildren",
        impact: "positive",
      },
    ],
    achievements: [
      "Won Indonesia&#39;s presidency on third attempt",
      "Maintained Jokowi&#39;s infrastructure development continuity",
      "Launched largest school nutrition programme in Indonesian history",
      "Maintained Indonesia&#39;s non-aligned ASEAN strategic posture",
    ],
    politicalViews:
      "Nationalist, pro-military, Indonesian sovereignty first. Maintains Jokowi&#39;s economic development model. Non-aligned between US and China — strategic autonomy as ASEAN&#39;s largest economy. Strong state role in economy.",
    approvalRating: 74,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Leads the world&#39;s third-largest democracy and largest Muslim-majority nation. His military background and contested past make him a complex figure as Indonesia navigates US–China competition in Southeast Asia.",
    region: "Asia-Pacific",
  },
  {
    id: "pezeshkian",
    name: "Masoud Pezeshkian",
    country: "Iran",
    countryCode: "IR",
    flag: "🇮🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Masoud_Pezeshkian_%282024%29.jpg/440px-Masoud_Pezeshkian_%282024%29.jpg",
    age: 70,
    birthYear: 1954,
    birthPlace: "Mahabad, West Azerbaijan, Iran",
    education: [
      {
        institution: "Tabriz University of Medical Sciences",
        degree: "M.D., Cardiac Surgery",
        year: 1980,
      },
      {
        institution: "Tabriz University of Medical Sciences",
        degree: "Specialist in Cardiac Surgery",
        year: 1992,
      },
    ],
    party: "Reformist Front",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Cardiac surgeon and long-serving MP from Tabriz who positioned himself as a moderate reformist. Succeeded Ebrahim Raisi after Raisi was killed in a helicopter crash in May 2024. Won a surprise runoff victory as the only viable reformist candidate — with broad backing from ex-President Khatami and nuclear negotiator Zarif.",
    significantEvents: [
      {
        year: 2024,
        event: "Elected president after Raisi killed in helicopter crash",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Appointed Mohammad Javad Zarif as strategic affairs VP",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Proposed resuming nuclear deal negotiations with West",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Iran–US indirect nuclear talks restarted in Oman",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Faces hardliner resistance to reforms on hijab law and press freedom",
        impact: "negative",
      },
    ],
    achievements: [
      "First reformist president in Iran since Khatami (2005)",
      "Restarted nuclear dialogue with Western powers",
      "Appointed technocratic cabinet including female ministers",
      "Reduced immediate risk of Iran–Israel military escalation through measured response",
    ],
    politicalViews:
      "Reformist moderate within Iran&#39;s clerical system. Advocates diplomatic engagement over confrontation, economic normalisation through nuclear deal, relaxed social restrictions domestically. Operates within boundaries set by Supreme Leader Khamenei.",
    approvalRating: 44,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Represents Iran&#39;s best opening for nuclear diplomacy in a decade, but operates under hard constraints from Supreme Leader Khamenei, the IRGC, and hardliner-dominated institutions.",
    region: "Middle East",
  },
  {
    id: "han",
    name: "Han Duck-soo",
    country: "South Korea",
    countryCode: "KR",
    flag: "🇰🇷",
    title: "Prime Minister (Acting President)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Han_Duck-soo_official_portrait_%282022%29.jpg/440px-Han_Duck-soo_official_portrait_%282022%29.jpg",
    age: 75,
    birthYear: 1949,
    birthPlace: "Jeonju, North Jeolla Province, South Korea",
    education: [
      {
        institution: "Seoul National University",
        degree: "B.A. Economics",
        year: 1971,
      },
      {
        institution: "Harvard University",
        degree: "Ph.D. Economics",
        year: 1979,
      },
    ],
    party: "Independent (technocratic)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Career technocrat and trade economist who served as Minister of Trade and Prime Minister under Roh Moo-hyun before returning to government under Yoon Suk-yeol. Became acting president twice in 2024–25 following the extraordinary political crisis triggered by Yoon&#39;s short-lived martial law declaration.",
    significantEvents: [
      {
        year: 2022,
        event: "Appointed Prime Minister under President Yoon Suk-yeol",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Yoon declares 6-hour martial law — National Assembly overturns it",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Became Acting President after Yoon&#39;s impeachment by parliament",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Han himself impeached briefly by opposition-controlled parliament",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Constitutional Court upheld Yoon impeachment; early election called",
        impact: "neutral",
      },
    ],
    achievements: [
      "Maintained governmental continuity during South Korea&#39;s worst constitutional crisis in decades",
      "Kept US–South Korea alliance stable during political turmoil",
      "Experienced negotiator of South Korea&#39;s US free trade agreement (KORUS FTA)",
      "Harvard-trained economist — one of Asia&#39;s leading trade policy experts",
    ],
    politicalViews:
      "Technocratic centrist conservative. Prioritises trade liberalisation, US alliance, and South Korea&#39;s export-driven economic model. Non-partisan in style; pragmatic in governance. Cautious on North Korea engagement.",
    approvalRating: 38,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "An accidental president thrust into power by constitutional crisis. His steady-hand caretaker governance prevented South Korea&#39;s political meltdown from becoming an economic one.",
    region: "Asia-Pacific",
  },
  {
    id: "tusk",
    name: "Donald Tusk",
    country: "Poland",
    countryCode: "PL",
    flag: "🇵🇱",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Donald_Tusk_2019_%28cropped%29.jpg/440px-Donald_Tusk_2019_%28cropped%29.jpg",
    age: 68,
    birthYear: 1957,
    birthPlace: "Gdańsk, Poland",
    education: [
      {
        institution: "University of Gdańsk",
        degree: "M.A. History",
        year: 1980,
      },
    ],
    party: "Civic Coalition (KO) / European People&#39;s Party",
    ideology: "Liberal",
    termsInOffice: [
      { from: 2007, to: 2014 },
      { from: 2023, to: "present" },
    ],
    background:
      "Former Polish PM, President of the European Council (2014–2019), and lifelong Solidarity movement figure from Gdańsk. Returned from Brussels to lead the opposition against PiS, winning a dramatic coalition victory in October 2023 to restore democratic norms after eight years of populist rule.",
    significantEvents: [
      {
        year: 2007,
        event: "Led Poland to record EU fund absorption and economic growth",
        impact: "positive",
      },
      {
        year: 2014,
        event: "Became European Council President — top EU leadership role",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Led opposition coalition to defeat PiS after 8 years of rule",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Began dismantling PiS&#39;s judicial and media capture",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Poland&#39;s defence budget raised to 4% of GDP — highest in NATO",
        impact: "positive",
      },
    ],
    achievements: [
      "Ousted PiS — restored judicial independence and public media",
      "Poland&#39;s NATO defence spending raised to 4% — world&#39;s highest share",
      "Strong EU recovery fund utilisation champion",
      "Instrumental in European unity on Ukraine and Russia sanctions",
    ],
    politicalViews:
      "Pro-European liberal democrat. Strong Atlanticist — champions NATO as cornerstone of Polish security. Democratic rule of law restoration after PiS erosion. Cautious on Russia, hawkish on Ukraine support. Centrist economics.",
    approvalRating: 44,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "One of Europe&#39;s most consequential political comebacks — returning to dismantle a decade of populist institutional capture and reassert Poland as a core EU and NATO pillar.",
    region: "Europe",
  },
  {
    id: "maduro",
    name: "Nicolás Maduro",
    country: "Venezuela",
    countryCode: "VE",
    flag: "🇻🇪",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Nicol%C3%A1s_Maduro_%28cropped%29.jpg/440px-Nicol%C3%A1s_Maduro_%28cropped%29.jpg",
    age: 62,
    birthYear: 1962,
    birthPlace: "Caracas, Venezuela",
    education: [
      {
        institution: "Escuela Técnica Industrial",
        degree: "Bus Driver Training / Technical",
        year: 1981,
      },
    ],
    party: "United Socialist Party of Venezuela (PSUV)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2013, to: "present" }],
    background:
      "Former bus driver and trade union activist who rose through Hugo Chávez&#39;s Bolivarian movement. Handpicked by Chávez as successor before his death in 2013. Has clung to power through hyperinflation, economic collapse, mass exodus of 7.7M Venezuelans, and disputed elections, surviving with military and Cuban backing.",
    significantEvents: [
      {
        year: 2013,
        event: "Won disputed election after Chávez&#39;s death by 1.5% margin",
        impact: "neutral",
      },
      {
        year: 2017,
        event:
          "Dissolved opposition-controlled National Assembly; installed constituent assembly",
        impact: "negative",
      },
      {
        year: 2019,
        event:
          "Juan Guaidó declared president; 50+ countries backed him — Maduro survived",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Partial sanctions lifted after Barbados Agreement on elections",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Declared winner of disputed election; massive fraud allegations; protests suppressed",
        impact: "negative",
      },
    ],
    achievements: [
      "Survived the most comprehensive US sanctions programme outside North Korea",
      "Maintained military loyalty through economic patronage for 11+ years",
      "Retained Cuba, Russia, China, and Iran as strategic allies",
      "Weathered Guaidó challenge that had US recognition for 3 years",
    ],
    politicalViews:
      "Bolivarian socialist. Anti-US imperialism, pro-ALBA regional bloc, state control of economy and PDVSA oil. Maintains Chávez&#39;s cult of personality as legitimising device. Deep ties to Cuba&#39;s security establishment.",
    approvalRating: 21,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "Presided over the largest economic collapse in Latin American history outside wartime — GDP fell 80%, 7.7M fled the country. Survival through repression despite international isolation is his most remarkable &#39;achievement&#39;.",
    region: "Americas",
  },
  {
    id: "mbz",
    name: "Mohammed bin Zayed Al Nahyan",
    country: "United Arab Emirates",
    countryCode: "AE",
    flag: "🇦🇪",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Mohamed_bin_Zayed_Al_Nahyan_%28cropped%29.jpg/440px-Mohamed_bin_Zayed_Al_Nahyan_%28cropped%29.jpg",
    age: 63,
    birthYear: 1961,
    birthPlace: "Abu Dhabi, United Arab Emirates",
    education: [
      {
        institution: "UAE Military Academy (Sandhurst programme)",
        degree: "Military Studies",
        year: 1979,
      },
      {
        institution: "Royal Military Academy Sandhurst",
        degree: "Officer Training",
        year: 1979,
      },
    ],
    party: "House of Nahyan (Federation of Emirates)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Known as MBZ. The de facto ruler of the UAE for nearly two decades before officially becoming President in 2022 following Sheikh Khalifa&#39;s death. Third son of UAE founder Sheikh Zayed. Architect of the UAE&#39;s transformation into a regional military, financial, and tech hub.",
    significantEvents: [
      {
        year: 2011,
        event:
          "UAE joins NATO intervention in Libya; MBZ establishes UAE as military actor",
        impact: "neutral",
      },
      {
        year: 2020,
        event: "Abraham Accords — UAE normalises relations with Israel",
        impact: "positive",
      },
      {
        year: 2021,
        event:
          "UAE&#39;s Hope Probe reaches Mars orbit — first Arab interplanetary mission",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Became UAE President; cooled ties with Biden US administration",
        impact: "neutral",
      },
      {
        year: 2023,
        event: "UAE hosts COP28; positioned as climate-transition voice",
        impact: "neutral",
      },
    ],
    achievements: [
      "Abraham Accords signatory — UAE–Israel full normalisation",
      "Hope Mars Mission — Arab world&#39;s first interplanetary spacecraft",
      "UAE ranked globally top for safety, business, and quality of life",
      "Positioned UAE as the Gulf&#39;s leading AI and tech investment hub",
    ],
    politicalViews:
      "Absolute monarchy pragmatist. Pro-Western security alignment but increasingly independent from US direction. Anti-Islamist (Muslim Brotherhood considered terrorist organisation in UAE). Pro-business liberalisation, zero tolerance for political opposition. Plays all sides — US, China, Russia — for maximum leverage.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed a federation of desert sheikhdoms into one of the world&#39;s most influential small states. UAE punch exceeds its size dramatically in finance, diplomacy, military, and AI investment under his leadership.",
    region: "Middle East",
  },
  // ── BATCH 4: Africa ────────────────────────────────────────────────────────
  {
    id: "mnangagwa",
    name: "Emmerson Mnangagwa",
    country: "Zimbabwe",
    countryCode: "ZW",
    flag: "🇿🇼",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Emmerson_Mnangagwa_%28cropped%29.jpg/440px-Emmerson_Mnangagwa_%28cropped%29.jpg",
    age: 81,
    birthYear: 1942,
    birthPlace: "Zvishavane, Southern Rhodesia (now Zimbabwe)",
    education: [
      { institution: "University of Zambia", degree: "Law Degree", year: 1983 },
    ],
    party: "ZANU–PF",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2017, to: "present" }],
    background:
      "Known as 'The Crocodile', Mnangagwa was a longtime Mugabe loyalist and intelligence chief before leading the military-backed coup that ousted Mugabe in 2017. Promises economic reform while presiding over continued political repression.",
    significantEvents: [
      {
        year: 2017,
        event: "Military coup removes Mugabe; Mnangagwa assumes presidency",
        impact: "neutral",
      },
      {
        year: 2018,
        event:
          "Disputed election win; post-vote military crackdown on protesters",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Re-elected amid widespread election fraud allegations by SADC",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Zimbabwe introduces ZiG gold-backed currency after hyperinflation",
        impact: "neutral",
      },
    ],
    achievements: [
      "Re-engaged with international investors post-Mugabe",
      "Zimbabwe rejoined Commonwealth as observer",
      "Introduced gold-backed ZiG currency stabilisation attempt",
      "Expanded mining sector investment agreements",
    ],
    politicalViews:
      "ZANU-PF nationalism, resource sovereigntism, Look East (China) policy. Promises 'Zimbabwe is Open for Business' but maintains authoritarian political control. Land redistribution legacy of Mugabe era preserved.",
    approvalRating: 28,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "Failed to deliver promised break from Mugabe-era governance. Zimbabwe remains in economic crisis with high unemployment and political repression, though international isolation has slightly eased.",
    region: "Africa",
  },
  {
    id: "kagame",
    name: "Paul Kagame",
    country: "Rwanda",
    countryCode: "RW",
    flag: "🇷🇼",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Paul_Kagame_2014.jpg/440px-Paul_Kagame_2014.jpg",
    age: 66,
    birthYear: 1957,
    birthPlace: "Tambwe, Gitarama Province, Rwanda",
    education: [
      {
        institution: "Rwanda Military Academy",
        degree: "Military Training",
        year: 1979,
      },
      {
        institution: "US Army Command and General Staff College",
        degree: "Advanced Military Studies",
        year: 1990,
      },
    ],
    party: "Rwandan Patriotic Front (RPF)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2000, to: "present" }],
    background:
      "Led the RPF military force that ended the 1994 Rwandan genocide. Built Rwanda from one of Africa&#39;s most devastated nations into a model of economic development, tech investment, and governance — though at the cost of political pluralism and press freedom.",
    significantEvents: [
      {
        year: 1994,
        event: "RPF ends Rwandan genocide; Kagame becomes de facto leader",
        impact: "positive",
      },
      {
        year: 2000,
        event:
          "Formally becomes President; launches Vision 2020 development plan",
        impact: "positive",
      },
      {
        year: 2017,
        event: "Re-elected with 98.8% — term limits removed by referendum",
        impact: "negative",
      },
      {
        year: 2022,
        event: "Rwanda accused of backing M23 rebels in eastern DRC",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Elected African Union chairperson by peers",
        impact: "positive",
      },
    ],
    achievements: [
      "Rwanda transformed from genocide-devastated to fastest-growing African economy",
      "Kigali ranked Africa&#39;s cleanest and safest city",
      "30%+ female MPs — world&#39;s highest proportion since 2008",
      "Universal health insurance coverage achieved",
    ],
    politicalViews:
      "Development-first authoritarianism. Pan-African, Chinese development model admirer. Ruthlessly anti-corruption domestically. Aggressive defender of Rwandan interests internationally — including targeted operations abroad.",
    approvalRating: 93,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "One of Africa&#39;s most debated leaders — remarkable development record built on suppression of political opposition and alleged extraterritorial assassinations of dissidents. The Rwanda paradox defines African development discourse.",
    region: "Africa",
  },
  {
    id: "tinubu",
    name: "Bola Tinubu",
    country: "Nigeria",
    countryCode: "NG",
    flag: "🇳🇬",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Bola_Tinubu_official_portrait_%282023%29.jpg/440px-Bola_Tinubu_official_portrait_%282023%29.jpg",
    age: 72,
    birthYear: 1952,
    birthPlace: "Lagos, Nigeria",
    education: [
      {
        institution: "Chicago State University",
        degree: "B.Sc. Accounting",
        year: 1979,
      },
    ],
    party: "All Progressives Congress (APC)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Former Lagos State Governor (1999–2007) widely credited with transforming Lagos into Africa&#39;s largest economy. Master political kingmaker who engineered Buhari&#39;s 2015 election win before winning the presidency himself in 2023 in a three-way contested race.",
    significantEvents: [
      {
        year: 2023,
        event: "Won disputed three-way presidential election with 37% of votes",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Removed fuel subsidy on first day — fuel prices tripled overnight",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Floated Nigerian naira — lost 70% of value within months",
        impact: "negative",
      },
      {
        year: 2024,
        event: "#EndBadGovernance protests — security forces killed protesters",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Binance executives arrested; crypto crackdown launched",
        impact: "neutral",
      },
    ],
    achievements: [
      "Removed fuel subsidy costing $10B/yr — necessary fiscal reform",
      "Unified Nigeria&#39;s multiple exchange rates",
      "Increased federal revenue collection significantly",
      "ECOWAS mediation in Sahel military coup crisis",
    ],
    politicalViews:
      "Conservative pragmatist, pro-market reforms, federalist. Strong South-West Yoruba political base. Pro-business Lagos model applied nationally. Non-ideological — focuses on practical economic governance and political coalition-building.",
    approvalRating: 24,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Leading Africa&#39;s most populous nation through painful economic reforms. Fuel subsidy removal and naira float are structurally necessary but have caused severe short-term hardship for ordinary Nigerians.",
    region: "Africa",
  },
  {
    id: "abiy",
    name: "Abiy Ahmed",
    country: "Ethiopia",
    countryCode: "ET",
    flag: "🇪🇹",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Abiy_Ahmed_Ali_2019-08-14_%28cropped%29.jpg/440px-Abiy_Ahmed_Ali_2019-08-14_%28cropped%29.jpg",
    age: 48,
    birthYear: 1976,
    birthPlace: "Beshasha, Illubabor, Ethiopia",
    education: [
      {
        institution: "Microlink IT College",
        degree: "B.Sc. Computer Science",
        year: 2001,
      },
      {
        institution: "Greenwich University",
        degree: "M.Sc. Transformational Leadership",
        year: 2013,
      },
      {
        institution: "Addis Ababa University",
        degree: "Ph.D. Peace and Security Studies",
        year: 2017,
      },
    ],
    party: "Prosperity Party",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2018, to: "present" }],
    background:
      "Youngest African leader when appointed in 2018; intelligence officer and military veteran who launched historic peace with Eritrea and released political prisoners. Won the Nobel Peace Prize in 2019 — then launched a devastating civil war against the Tigray region in 2020.",
    significantEvents: [
      {
        year: 2018,
        event:
          "Appointed PM; released political prisoners, ended emergency law",
        impact: "positive",
      },
      {
        year: 2018,
        event:
          "Peace deal with Eritrea ends 20-year conflict — Nobel Prize result",
        impact: "positive",
      },
      { year: 2019, event: "Awarded Nobel Peace Prize", impact: "positive" },
      {
        year: 2020,
        event:
          "Launched military offensive against Tigray — two-year civil war begins",
        impact: "negative",
      },
      {
        year: 2022,
        event: "Pretoria peace agreement ends Tigray war after 500,000+ deaths",
        impact: "neutral",
      },
    ],
    achievements: [
      "Nobel Peace Prize 2019 for Eritrea peace deal",
      "Released all political prisoners and dismantled repressive laws",
      "Pretoria Agreement ended two-year Tigray civil war",
      "Addis Ababa transformation — green city initiative",
    ],
    politicalViews:
      "Pan-Ethiopian nationalist, Prosperity Party unity ideology (replacing ethnic federalism). Medemer (synergy) philosophy. Pro-development, pro-foreign investment. Authoritarian consolidation masked by reformist early image.",
    approvalRating: 35,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Nobel Peace Prize winner who then prosecuted one of Africa&#39;s bloodiest civil wars. His contradictory record — diplomacy peace and domestic war — defines the tragedy of Ethiopia&#39;s post-2020 trajectory.",
    region: "Africa",
  },
  {
    id: "sisi",
    name: "Abdel Fattah el-Sisi",
    country: "Egypt",
    countryCode: "EG",
    flag: "🇪🇬",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Abdel_Fattah_el-Sisi_in_2021.jpg/440px-Abdel_Fattah_el-Sisi_in_2021.jpg",
    age: 69,
    birthYear: 1954,
    birthPlace: "Cairo, Egypt",
    education: [
      {
        institution: "Egyptian Military Academy",
        degree: "Military Studies",
        year: 1977,
      },
      {
        institution: "US Army War College",
        degree: "Advanced Military Studies",
        year: 2006,
      },
    ],
    party: "Independent (military-backed)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2014, to: "present" }],
    background:
      "Former army chief and head of military intelligence who led the 2013 coup against elected President Mohamed Morsi. Has presided over Egypt&#39;s largest wave of political repression in modern history while undertaking the largest construction programme since the Pharaohs.",
    significantEvents: [
      {
        year: 2013,
        event:
          "Led military coup against elected President Morsi — mass crackdown",
        impact: "negative",
      },
      {
        year: 2014,
        event:
          "Elected president; Rabaa massacre killed 800+ Muslim Brotherhood supporters",
        impact: "negative",
      },
      {
        year: 2021,
        event: "New administrative capital — $58B megacity built in desert",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Egypt faces IMF-mandated currency devaluation and economic crisis",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Gaza war mediator — hosts critical hostage and ceasefire talks",
        impact: "positive",
      },
    ],
    achievements: [
      "New Suez Canal expansion — parallel channel added",
      "New administrative capital constructed ($58B investment)",
      "Egypt as key Gaza ceasefire mediator",
      "Large-scale energy infrastructure including el-Dabaa nuclear plant",
    ],
    politicalViews:
      "Military nationalism, secular authoritarianism, anti-Islamism. Anti-Iran, anti-Muslim Brotherhood. Balances US military aid with Russian nuclear deal and Gulf funding. Maintains Egypt&#39;s pivotal role as Arab world mediator.",
    approvalRating: 50,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Built Egypt&#39;s largest infrastructure programme in modern history while jailing 60,000+ political prisoners. Egypt teeters on economic default under his rule, sustained only by Gulf and IMF bailouts.",
    region: "Africa",
  },
  // ── BATCH 5: Asia ─────────────────────────────────────────────────────────
  {
    id: "yunus",
    name: "Muhammad Yunus",
    country: "Bangladesh",
    countryCode: "BD",
    flag: "🇧🇩",
    title: "Chief Adviser (Interim Government)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Muhammad_Yunus_in_2017_%28cropped%29.jpg/440px-Muhammad_Yunus_in_2017_%28cropped%29.jpg",
    age: 84,
    birthYear: 1940,
    birthPlace: "Chittagong, Bengal (now Bangladesh)",
    education: [
      {
        institution: "Dhaka University",
        degree: "B.A. & M.A. Economics",
        year: 1961,
      },
      {
        institution: "Vanderbilt University",
        degree: "Ph.D. Economics",
        year: 1969,
      },
    ],
    party: "Non-partisan (National Consensus Party associated)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Nobel Peace Prize-winning economist and founder of the Grameen Bank microfinance model. Was called out of retirement to lead Bangladesh&#39;s interim government after student-led protests deposed Sheikh Hasina who fled to India in August 2024.",
    significantEvents: [
      {
        year: 1983,
        event: "Founded Grameen Bank — pioneered microfinance for the poor",
        impact: "positive",
      },
      {
        year: 2006,
        event: "Awarded Nobel Peace Prize for microfinance work",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Student uprising deposes Sheikh Hasina — Yunus called to lead",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Heads interim government; major reform agenda launched",
        impact: "neutral",
      },
    ],
    achievements: [
      "Nobel Peace Prize 2006 — Grameen Bank served 9M+ borrowers",
      "Microfinance model replicated in 100+ countries",
      "Called to lead Bangladesh&#39;s democratic transition at age 84",
      "Anti-corruption reform commissions established",
    ],
    politicalViews:
      "Social entrepreneur, poverty reduction through market mechanisms. Pro-democratic governance reform, anti-corruption. Non-partisan reformist. Advocates &#39;social business&#39; model globally. Internationally respected.",
    approvalRating: 62,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Global icon of poverty alleviation who became an accidental head of state. His leadership of Bangladesh&#39;s fragile transition is defining the country&#39;s post-authoritarian political future.",
    region: "Asia-Pacific",
  },
  {
    id: "dissanayake",
    name: "Anura Kumara Dissanayake",
    country: "Sri Lanka",
    countryCode: "LK",
    flag: "🇱🇰",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Anura_Kumara_Dissanayake_%28cropped%29.jpg/440px-Anura_Kumara_Dissanayake_%28cropped%29.jpg",
    age: 55,
    birthYear: 1968,
    birthPlace: "Thambuttegama, North Central Province, Sri Lanka",
    education: [
      {
        institution: "University of Kelaniya",
        degree: "B.Sc. Physical Science",
        year: 1995,
      },
    ],
    party: "National People&#39;s Power (NPP) / JVP",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Marxist-rooted opposition leader who won Sri Lanka&#39;s 2024 presidential election on an anti-corruption platform following the 2022 economic collapse and ouster of Gotabaya Rajapaksa. First president elected from outside the two traditional party dynasties in Sri Lanka&#39;s history.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Aragalaya uprising deposes Gotabaya — Dissanayake&#39;s party gains support",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Won presidential election — historic break from UNP/SLFP duopoly",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Won snap parliamentary election with 2/3 majority",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Continuing IMF debt restructuring programme",
        impact: "neutral",
      },
    ],
    achievements: [
      "First president from outside Sri Lanka&#39;s traditional political dynasties",
      "Won snap parliamentary 2/3 majority — unprecedented for new party",
      "Anti-corruption campaign arrests senior officials",
      "Maintained IMF restructuring to stabilise post-crisis economy",
    ],
    politicalViews:
      "Democratic socialist, strong anti-corruption mandate. Continuing IMF programme despite socialist roots — pragmatic governance. Pro-multilateral, non-aligned between India and China. Ethnic reconciliation with Tamil community.",
    approvalRating: 69,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Historic mandate reflecting Sri Lanka&#39;s rejection of corrupt elite politics after the 2022 economic collapse. Leading the country&#39;s most consequential political transition in decades.",
    region: "Asia-Pacific",
  },
  {
    id: "marcos",
    name: "Ferdinand Marcos Jr.",
    country: "Philippines",
    countryCode: "PH",
    flag: "🇵🇭",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Ferdinand_Marcos_Jr._2022.jpg/440px-Ferdinand_Marcos_Jr._2022.jpg",
    age: 67,
    birthYear: 1957,
    birthPlace: "Manila, Philippines",
    education: [
      {
        institution: "University of Oxford, Magdalen College",
        degree: "Special Diploma in Social Studies (History)",
        year: 1978,
      },
    ],
    party: "Partido Federal ng Pilipinas (PFP)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Son of dictator Ferdinand Marcos Sr. who fled the country in 1986 during the People Power revolution. Won the 2022 election with the largest vote share since 1986. His alliance with Sara Duterte (VP) split in 2024 into a bitter political rupture.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Won election with 59% — despite father&#39;s martial law legacy",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Pivoted Philippines toward US — allowed 4 new US military bases",
        impact: "positive",
      },
      {
        year: 2024,
        event: "South China Sea confrontations with China escalated",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Alliance with VP Sara Duterte publicly collapsed",
        impact: "negative",
      },
    ],
    achievements: [
      "Restored US military basing rights — 9 EDCA locations approved",
      "Expelled Chinese vessels from Philippine EEZ in South China Sea",
      "Major foreign investment deals in semiconductor and EV sectors",
      "Infrastructure programmes continued from Duterte era",
    ],
    politicalViews:
      "Conservative nationalist, strong US alliance pivot after Duterte&#39;s China tilt. Defends Philippine sovereignty against China in South China Sea. Pro-foreign investment, agriculture modernisation. Avoids confronting father&#39;s martial law legacy.",
    approvalRating: 48,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Repositioned Philippines dramatically toward the US, making it a centerpiece of Washington&#39;s Indo-Pacific strategy — but faces domestic political turbulence from his Duterte alliance collapse.",
    region: "Asia-Pacific",
  },
  {
    id: "paetongtarn",
    name: "Paetongtarn Shinawatra",
    country: "Thailand",
    countryCode: "TH",
    flag: "🇹🇭",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Paetongtarn_Shinawatra_2024_official_portrait.jpg/440px-Paetongtarn_Shinawatra_2024_official_portrait.jpg",
    age: 38,
    birthYear: 1986,
    birthPlace: "Bangkok, Thailand",
    education: [
      {
        institution: "University of Hertfordshire",
        degree: "B.A. Politics and International Relations",
        year: 2008,
      },
      { institution: "Chulalongkorn University", degree: "M.B.A.", year: 2017 },
    ],
    party: "Pheu Thai Party",
    ideology: "Populist",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Youngest Thai PM and daughter of exiled former PM Thaksin Shinawatra and niece of PM Yingluck Shinawatra. Both were ousted in military coups. Became PM after the Constitutional Court dissolved her predecessor&#39;s party over election ethics violations.",
    significantEvents: [
      {
        year: 2024,
        event: "Became Thailand&#39;s youngest and third Shinawatra-family PM",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Father Thaksin returned from exile and received royal pardon",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Constitutional Court dissolved her predecessor&#39;s Move Forward party",
        impact: "negative",
      },
      {
        year: 2025,
        event: "Navigating Myanmar border crisis as civil war intensifies",
        impact: "negative",
      },
    ],
    achievements: [
      "Youngest prime minister in Thai history",
      "10,000 baht digital wallet stimulus programme launched",
      "Continued Thaksin-era rural development policies",
      "ASEAN engagement on Myanmar humanitarian crisis",
    ],
    politicalViews:
      "Populist centre — flagship free money stimulus, rural welfare. Continuity of Thaksin&#39;s pro-rural, pro-poor policy line. Needs to maintain balance with military establishment that ousted her family twice.",
    approvalRating: 42,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Represents the resilience of the Shinawatra political brand in Thailand. Faces the same structural tension between elected populist governments and the Thai military-judicial establishment that toppled her predecessors.",
    region: "Asia-Pacific",
  },
  {
    id: "anwar",
    name: "Anwar Ibrahim",
    country: "Malaysia",
    countryCode: "MY",
    flag: "🇲🇾",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Anwar_Ibrahim_2022_official_portrait.jpg/440px-Anwar_Ibrahim_2022_official_portrait.jpg",
    age: 77,
    birthYear: 1947,
    birthPlace: "Cherok Tok Kun, Penang, Malaysia",
    education: [
      {
        institution: "University of Malaya",
        degree: "B.A. Malay Studies",
        year: 1971,
      },
    ],
    party: "Pakatan Harapan (People&#39;s Justice Party core)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Held as a political prisoner twice on sodomy charges widely seen as politically motivated. Waited 24 years to become PM after originally being Mahathir&#39;s deputy in the 1990s. Finally realised his ambition at 75 in November 2022 after a hung parliament gave him the kingmaker advantage.",
    significantEvents: [
      {
        year: 1998,
        event: "Fired by Mahathir; jailed on corruption and sodomy charges",
        impact: "negative",
      },
      {
        year: 2004,
        event: "Released from prison; begins long opposition journey",
        impact: "neutral",
      },
      {
        year: 2022,
        event: "Finally becomes PM at 75 after hung parliament",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Refuses to extradite Jho Low; anti-corruption prosecutions advanced",
        impact: "positive",
      },
    ],
    achievements: [
      "Completed Malaysia&#39;s most significant democratic transition",
      "Advanced 1MDB corruption prosecutions",
      "Strengthened Malaysia&#39;s economic ties with both US and China",
      "MADANI social reform framework launched",
    ],
    politicalViews:
      "Islamic democratic, social justice advocate, pro-reform. Committed to multiracial Malaysia under rule of law. Pragmatic foreign policy — balances US and China. Anti-corruption as core mandate.",
    approvalRating: 50,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "One of the great political perseverance stories in Asian democracy. Faces the paradox of needing to satisfy both reform expectations and the conservative Malay establishment that defines Malaysian politics.",
    region: "Asia-Pacific",
  },
  // ── BATCH 6: More Europe ───────────────────────────────────────────────────
  {
    id: "frederik",
    name: "King Frederik X",
    country: "Denmark",
    countryCode: "DK",
    flag: "🇩🇰",
    title: "King of Denmark",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/King_Frederik_X_of_Denmark_%28cropped%29.jpg/440px-King_Frederik_X_of_Denmark_%28cropped%29.jpg",
    age: 56,
    birthYear: 1968,
    birthPlace: "Copenhagen, Denmark",
    education: [
      {
        institution: "University of Aarhus",
        degree: "B.Sc. Political Science",
        year: 1995,
      },
      {
        institution: "Harvard University",
        degree: "Business studies (non-degree)",
        year: 1993,
      },
    ],
    party: "Danish Royal House",
    ideology: "Monarchy",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Became King of Denmark in January 2024 when his mother Queen Margrethe II abdicated — making it the first Danish royal abdication in 900 years. Former naval officer and Frogman Corps serviceman. Married to Australian-born Queen Mary.",
    significantEvents: [
      {
        year: 2004,
        event:
          "Married Mary Donaldson — Australian commoner, massive public support",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Queen Margrethe abdicates; Frederik becomes King on Jan 14 2024",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "First state visits as King; Greenland sovereignty debate intensifies",
        impact: "neutral",
      },
    ],
    achievements: [
      "Completed military service including Frogman Corps (Danish special forces)",
      "Active in environmental and climate causes",
      "Served in Danish military at sea, air and land",
      "Popular constitutional monarch with highest public support ratings",
    ],
    politicalViews:
      "Constitutional monarchy — non-political role. Personally vocal on climate change and environmental protection. Denmark&#39;s constitutional monarch acts on advice of elected government.",
    approvalRating: 82,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "New constitutional monarch at a time when Greenland&#39;s sovereignty is being tested by Trump&#39;s acquisition threats. Royal diplomacy and positioning of Denmark&#39;s Arctic interests is newly significant.",
    region: "Europe",
  },
  {
    id: "kristersson",
    name: "Ulf Kristersson",
    country: "Sweden",
    countryCode: "SE",
    flag: "🇸🇪",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Ulf_Kristersson_2022.jpg/440px-Ulf_Kristersson_2022.jpg",
    age: 61,
    birthYear: 1963,
    birthPlace: "Njurunda, Sundsvall, Sweden",
    education: [
      {
        institution: "Uppsala University",
        degree: "B.A. Economics",
        year: 1988,
      },
    ],
    party: "Moderate Party",
    ideology: "Conservative",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Led the right-wing coalition to victory in 2022, governing with parliamentary support from the Sweden Democrats — a party with neo-Nazi roots. Critically, navigated Sweden&#39;s accession to NATO, ending over 200 years of military non-alignment.",
    significantEvents: [
      {
        year: 2022,
        event: "Won election; formed government with SD support",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Sweden officially joins NATO — 200+ years of neutrality ended",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Sweden&#39;s gang violence crisis — bombing and shootings at record high",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Increased defence spending and military readiness",
        impact: "positive",
      },
    ],
    achievements: [
      "Completed Sweden&#39;s NATO accession — historic end to 200+ years of neutrality",
      "Deployed military to domestic gang crime areas",
      "Increased defence spending to meet NATO commitments",
      "Sweden&#39;s economic stability maintained despite European downturn",
    ],
    politicalViews:
      "Conservative, pro-NATO, market liberal economics. Tough on crime/immigration. Pro-EU but sceptical of European fiscal union. Strong Ukraine support. Maintains Sweden&#39;s traditionally high social welfare model.",
    approvalRating: 42,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Redefined Sweden&#39;s strategic identity by joining NATO. Governing a society in tension — wealthy, liberal, but experiencing serious gang violence that has no European precedent in scale.",
    region: "Europe",
  },
  {
    id: "orpo",
    name: "Petteri Orpo",
    country: "Finland",
    countryCode: "FI",
    flag: "🇫🇮",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Petteri_Orpo_2023.jpg/440px-Petteri_Orpo_2023.jpg",
    age: 55,
    birthYear: 1969,
    birthPlace: "Nousiainen, Finland",
    education: [
      {
        institution: "University of Turku",
        degree: "M.Sc. Political Science",
        year: 1997,
      },
    ],
    party: "National Coalition Party (NCP)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Led Finland&#39;s right-wing coalition government from April 2023. Finland joined NATO in April 2023 under the previous Sanna Marin government, meaning Orpo leads a NATO Finland for the first time. Finland&#39;s 1,300km border with Russia makes it NATO&#39;s most militarily significant new member.",
    significantEvents: [
      {
        year: 2023,
        event: "Led government formed after right-wing coalition victory",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Finland officially became NATO member — first full NATO year under Orpo",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Finland closed border with Russia after migrant instrumentalisation",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Coalition partner Finns Party&#39;s minister resigned over racist writing scandal",
        impact: "negative",
      },
    ],
    achievements: [
      "Managed Finland&#39;s first full year as NATO member",
      "Closed Russia border in response to hybrid attack",
      "Launched austerity programme to address Finland&#39;s deficit",
      "Increased defence spending and military readiness on Russian border",
    ],
    politicalViews:
      "Conservative, NATO hawk given 1,300km Russia border, fiscal austerity to reduce Finland&#39;s deficit. Pro-EU, pro-Ukraine, strong rule of law. Coalition with nationalist Finns Party creates ideological tensions.",
    approvalRating: 40,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs NATO&#39;s most exposed flank — Finland&#39;s 1,300km Russia border gives him heightened security stakes. Fiscal austerity programme is politically contentious in a Nordic welfare state.",
    region: "Europe",
  },
  // ── BATCH 7: Middle East / Africa completion ───────────────────────────────
  {
    id: "khamenei",
    name: "Ali Khamenei",
    country: "Iran",
    countryCode: "IR",
    flag: "🇮🇷",
    title: "Supreme Leader",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Ali_Khamenei_%282021%29.jpg/440px-Ali_Khamenei_%282021%29.jpg",
    age: 85,
    birthYear: 1939,
    birthPlace: "Mashhad, Iran",
    education: [
      {
        institution: "Qom Seminary",
        degree: "Islamic Jurisprudence (Fiqh)",
        year: 1964,
      },
    ],
    party: "Islamic Revolutionary System",
    ideology: "Theocrat",
    termsInOffice: [{ from: 1989, to: "present" }],
    background:
      "Iran&#39;s second and longest-serving Supreme Leader, holding power since Ayatollah Khomeini&#39;s death in 1989. Former president (1981–89) who controls the armed forces, judiciary, state media, and nuclear programme. His fatwa on nuclear weapons — that they are forbidden in Islam — is frequently cited in diplomacy despite evidence of weapons-relevant progress.",
    significantEvents: [
      {
        year: 2003,
        event:
          "Authorised nuclear programme expansion despite international pressure",
        impact: "negative",
      },
      {
        year: 2018,
        event: "Remained in JCPOA after Trump withdrawal — strategic patience",
        impact: "neutral",
      },
      {
        year: 2019,
        event: "Ordered IRGC attacks on Saudi Aramco facilities (attributed)",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Mahsa Amini protests — largest domestic uprising; violently suppressed",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Hamas Oct 7 attack and Gaza war reshapes Iran&#39;s regional position",
        impact: "neutral",
      },
    ],
    achievements: [
      "Maintained Islamic Republic through 35+ years of US sanctions",
      "Axis of Resistance built — Hezbollah, Hamas, Houthis, PMF",
      "Iran advanced to nuclear threshold state status",
      "UAE and Saudi normalisation (via China mediation) partially eased isolation",
    ],
    politicalViews:
      "Velayat-e Faqih (Guardianship of the Islamic Jurist) — theocratic supreme authority. Anti-US imperialism, anti-Zionism, pan-Islamic revolutionary ideology. Domestically suppresses all opposition. Strategically patient adversary to Western pressure.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "The most consequential figure in Middle Eastern geopolitics after MBS. His direction of the Axis of Resistance has defined regional conflict for a generation. Iran&#39;s nuclear programme under his watch has reached threshold status.",
    region: "Middle East",
  },
  {
    id: "aoun",
    name: "Joseph Aoun",
    country: "Lebanon",
    countryCode: "LB",
    flag: "🇱🇧",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Joseph_Aoun_2025.jpg/440px-Joseph_Aoun_2025.jpg",
    age: 60,
    birthYear: 1964,
    birthPlace: "Lebanon",
    education: [
      {
        institution: "Lebanese Military Academy",
        degree: "Military Studies",
        year: 1986,
      },
      {
        institution: "US Army War College",
        degree: "Strategic Studies",
        year: 2009,
      },
    ],
    party: "Independent (Military)",
    ideology: "Military Junta",
    termsInOffice: [{ from: 2025, to: "present" }],
    background:
      "Commander of the Lebanese Armed Forces who was elected president by parliament in January 2025, ending a 26-month presidential vacuum. His election — backed by US and Saudi pressure — followed Hezbollah&#39;s weakening after Oct 7 war. First army commander to become president since Michel Suleiman 2008.",
    significantEvents: [
      {
        year: 2019,
        event:
          "Led LAF through Lebanon&#39;s economic collapse and Oct 2019 revolution",
        impact: "neutral",
      },
      {
        year: 2020,
        event: "Beirut port explosion — led LAF disaster response",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Hezbollah weakened by Israel&#39;s campaign — political vacuum opens",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Elected president ending 26-month vacuum; international support received",
        impact: "positive",
      },
    ],
    achievements: [
      "Ended Lebanon&#39;s historic 26-month presidential vacuum",
      "Secured early US and Saudi backing for reform agenda",
      "Maintained LAF neutrality during years of political paralysis",
      "International donor pledges linked to his government&#39;s reforms secured",
    ],
    politicalViews:
      "Military institutionalist — Lebanese sovereignty, armed forces supremacy, Hezbollah disarmament goal. Works with West and Saudi Arabia. Pro-reform and reconstruction.",
    approvalRating: 58,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Represents Lebanon&#39;s best opportunity for reform and sovereignty restoration since the Taif Agreement. His success depends on whether post-Hezbollah political realignment holds.",
    region: "Middle East",
  },
  {
    id: "alsharaa",
    name: "Ahmad al-Sharaa",
    country: "Syria",
    countryCode: "SY",
    flag: "🇸🇾",
    title: "President (Transitional)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Ahmad_al-Sharaa_2025.jpg/440px-Ahmad_al-Sharaa_2025.jpg",
    age: 42,
    birthYear: 1982,
    birthPlace: "Riyadh, Saudi Arabia (Syrian family)",
    education: [
      {
        institution: "University of Damascus",
        degree: "Law (incomplete)",
        year: 2003,
      },
    ],
    party: "Hayat Tahrir al-Sham (HTS) / Syrian Transitional Government",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Former al-Qaeda affiliate who rebranded as a pragmatic Islamist nationalist. HTS forces led the spectacular offensive that toppled Bashar al-Assad in December 2024 in just 12 days. Now leads Syria&#39;s transitional government and repositioned Syria toward Turkey and the West.",
    significantEvents: [
      {
        year: 2013,
        event:
          "Led Jabhat al-Nusra (al-Qaeda Syria affiliate) rebranded as HTS over time",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "HTS-led offensive topples Assad in 12 days — shocking the world",
        impact: "positive",
      },
      {
        year: 2024,
        event: "US removes HTS from terrorist designation under pressure",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "International diplomatic recognition events begin; Arab League engagement",
        impact: "positive",
      },
    ],
    achievements: [
      "Ended Assad family&#39;s 54-year rule over Syria",
      "Freed thousands from Assad&#39;s notorious prisons",
      "Secured international diplomatic recognition for transitional government",
      "Maintained relative stability in Damascus post-transition",
    ],
    politicalViews:
      "Evolved from jihadi ideology to pragmatic Syrian nationalist. Promises inclusive transitional governance. Pro-Turkey, seeking Western recognition and sanctions relief. Projects moderation while maintaining Islamist base.",
    approvalRating: 54,
    approvalTrend: "stable",
    status: "Transitional",
    impact:
      "The most dramatic leadership transition in Middle Eastern history in a decade. His ability to consolidate Syria&#39;s transition and prevent new civil war will define the region for years.",
    region: "Middle East",
  },
  {
    id: "barzani",
    name: "Masrour Barzani",
    country: "Kurdistan Region (Iraq)",
    countryCode: "IQ",
    flag: "🇮🇶",
    title: "Prime Minister, Kurdistan Regional Government",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Masrour_Barzani_2019_%28cropped%29.jpg/440px-Masrour_Barzani_2019_%28cropped%29.jpg",
    age: 54,
    birthYear: 1969,
    birthPlace: "Salahaddin, Kurdistan, Iraq",
    education: [
      {
        institution: "American University of Washington",
        degree: "B.A. International Affairs",
        year: 1993,
      },
    ],
    party: "Kurdistan Democratic Party (KDP)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Son of legendary Kurdish leader Masoud Barzani. Served as head of KRG intelligence for 20 years before becoming PM in 2019. Navigates the impossible triangle of Baghdad, Ankara, and Tehran while pursuing Kurdish autonomy and Western security ties.",
    significantEvents: [
      {
        year: 2014,
        event:
          "Directed KRG intelligence during ISIS offensive — Peshmerga fought ISIS",
        impact: "positive",
      },
      {
        year: 2019,
        event: "Became KRG Prime Minister after years as intelligence chief",
        impact: "neutral",
      },
      {
        year: 2022,
        event:
          "Iranian ballistic missile strikes on KRG territory — diplomatic crisis",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Secured continued US military presence in Kurdistan Region",
        impact: "positive",
      },
    ],
    achievements: [
      "Maintained KRG stability through ISIS and regional instability",
      "Secured Western investment in Kurdistan&#39;s oil sector",
      "Kept Peshmerga as frontline partner for US counter-ISIS operations",
      "Navigated Iraq&#39;s complex federal politics for maximum autonomy",
    ],
    politicalViews:
      "Kurdish nationalist, pro-Western security ties, pro-Israel informally. Economic liberalism in KRG. Balances Baghdad autonomy demands with Ankara&#39;s anti-PKK operations in KRG territory.",
    approvalRating: 51,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Holds together one of the Middle East&#39;s most stable and pro-Western entities amid ISIS legacy, Iranian pressure, Turkish military operations, and Baghdad political negotiations.",
    region: "Middle East",
  },
  // ── BATCH 8: More Americas ─────────────────────────────────────────────────
  {
    id: "petro",
    name: "Gustavo Petro",
    country: "Colombia",
    countryCode: "CO",
    flag: "🇨🇴",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Gustavo_Petro_2022_official.jpg/440px-Gustavo_Petro_2022_official.jpg",
    age: 64,
    birthYear: 1960,
    birthPlace: "San Juan Nepomuceno, Bolívar, Colombia",
    education: [
      {
        institution: "Universidad Externado de Colombia",
        degree: "B.A. Economics",
        year: 1987,
      },
    ],
    party: "Pacto Histórico / Colombia Humana",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Former M-19 guerrilla turned politician who became Colombia&#39;s first left-wing president in 2022. Was Bogotá mayor 2012–2015. His election ended the traditional Conservative-Liberal duopoly that has governed Colombia since independence.",
    significantEvents: [
      {
        year: 2022,
        event: "Won election — Colombia&#39;s first left-wing president",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Restored diplomatic relations with Venezuela",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Total Peace policy — negotiations with all armed groups launched",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Total Peace negotiations stalled; ELN broke ceasefire",
        impact: "negative",
      },
    ],
    achievements: [
      "Historic first left-wing president in Colombia",
      "Total Peace dialogue engaged 6+ armed groups simultaneously",
      "Colombia&#39;s first female VP — Francia Márquez, Afro-Colombian activist",
      "Restored Venezuela relations — 3 years of diplomatic rupture ended",
    ],
    politicalViews:
      "Democratic socialist, anti-extractivism (no new oil licences), peace process advocate. Environmental justice, land reform, universal healthcare. Foreign policy — non-aligned, Latin American integration, pro-Global South voice.",
    approvalRating: 37,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Historic figure whose peace agenda has struggled against armed groups&#39; continued violence. His anti-oil position threatens Colombia&#39;s fiscal base; progressive agenda faces implementation barriers in a conservative congress.",
    region: "Americas",
  },
  {
    id: "boluarte",
    name: "Dina Boluarte",
    country: "Peru",
    countryCode: "PE",
    flag: "🇵🇪",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Dina_Boluarte_2022_%28cropped%29.jpg/440px-Dina_Boluarte_2022_%28cropped%29.jpg",
    age: 62,
    birthYear: 1962,
    birthPlace: "Chalhuanca, Apurímac, Peru",
    education: [
      {
        institution: "National Major University of San Marcos",
        degree: "B.A. Law",
        year: 1993,
      },
    ],
    party: "Free Peru (Perú Libre) — later distanced",
    ideology: "Centrist",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Peru&#39;s first female president who assumed office after President Pedro Castillo&#39;s failed self-coup in December 2022. Peru has had 6 presidents in 7 years. Boluarte&#39;s government used deadly force against protesters in early 2023, killing 49 people.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Became president after Castillo&#39;s failed self-coup and impeachment",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Security forces killed 49 protesters — UN investigation demanded",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Watches scandal — luxury Rolex watches unexplained on official salary",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Peru joins Cobre Panama copper debate as mining focus",
        impact: "neutral",
      },
    ],
    achievements: [
      "First female president in Peruvian history",
      "Maintained macroeconomic stability during political chaos",
      "Peru&#39;s economy remains one of LatAm&#39;s most stable",
      "Completed Callao deepwater port expansion (Chinese-invested)",
    ],
    politicalViews:
      "Pragmatic centrist — moved from left (Free Peru) to business-friendly governance. Pro-foreign investment, anti-Castillo, pro-stability. Faces criminal investigation for protest deaths. Maintains relations with neighbours.",
    approvalRating: 10,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Symbol of Peru&#39;s chronic political dysfunction — the country&#39;s 6th president in 7 years. Governs with rock-bottom approval amid congressional blockage and ongoing criminal investigations.",
    region: "Americas",
  },
  {
    id: "noboa",
    name: "Daniel Noboa",
    country: "Ecuador",
    countryCode: "EC",
    flag: "🇪🇨",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Daniel_Noboa_2023_official_portrait.jpg/440px-Daniel_Noboa_2023_official_portrait.jpg",
    age: 37,
    birthYear: 1987,
    birthPlace: "Guayaquil, Ecuador",
    education: [
      {
        institution: "Babson College",
        degree: "B.Sc. Business Administration",
        year: 2010,
      },
      {
        institution: "Harvard Kennedy School",
        degree: "M.P.A. (Masters in Public Administration)",
        year: 2016,
      },
    ],
    party: "National Democratic Action (ADN)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Son of banana billionaire Álvaro Noboa — one of Ecuador&#39;s wealthiest families. Youngest Ecuadorian president ever at 35. Won from nowhere declaring war on drug cartels that had turned Ecuador from one of LatAm&#39;s most peaceful countries into one of its most violent.",
    significantEvents: [
      {
        year: 2023,
        event: "Won election as Ecuador&#39;s youngest-ever president",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Declared &#39;internal armed conflict&#39; against gangs; military deployed",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "State television station taken over live on air by masked gunmen",
        impact: "negative",
      },
      {
        year: 2025,
        event: "Re-elected for full term after initial emergency victory",
        impact: "positive",
      },
    ],
    achievements: [
      "Youngest president in Ecuador&#39;s modern history",
      "Military crackdown reduced homicide rate in key cities",
      "Built El Rodeo maximum security prison for cartel leaders",
      "Re-elected with strong mandate on security platform",
    ],
    politicalViews:
      "Right-wing security hawk, pro-US, pro-business. Declared internal armed conflict — unprecedented in Ecuador. Tough on crime, capital punishment advocate. Opposes socialism in region.",
    approvalRating: 65,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed Ecuador&#39;s political narrative from fragile stability to active wartime anti-cartel president. His iron-fist approach has shown results in some cities but at significant human rights concerns.",
    region: "Americas",
  },
  // ── BATCH 9: More Africa ───────────────────────────────────────────────────
  {
    id: "ruto",
    name: "William Ruto",
    country: "Kenya",
    countryCode: "KE",
    flag: "🇰🇪",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/William_Ruto_official_portrait_2022.jpg/440px-William_Ruto_official_portrait_2022.jpg",
    age: 57,
    birthYear: 1966,
    birthPlace: "Kamagut, Uasin Gishu, Kenya",
    education: [
      {
        institution: "University of Nairobi",
        degree: "B.Sc. Botany & Zoology",
        year: 1990,
      },
      {
        institution: "University of Nairobi",
        degree: "Ph.D. Plant Ecology",
        year: 2011,
      },
    ],
    party: "Kenya Kwanza / United Democratic Alliance (UDA)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Rose from selling chickens on the roadside to become Kenya&#39;s 5th president. Former deputy president under Kenyatta who fell out with his running mate to run independently. Campaigned on 'hustler nation' bottom-up economics but faced gen Z-led #RejectFinanceBill uprising in 2024.",
    significantEvents: [
      {
        year: 2022,
        event: "Won narrow victory — 50.5% in disputed count",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Gen Z #RejectFinanceBill protests storm parliament; 40+ killed",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Withdrew Finance Bill; dismissed cabinet under pressure",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Sent Kenyan police to Haiti peacekeeping mission",
        impact: "positive",
      },
    ],
    achievements: [
      "Kenya Kwanza bottom-up economic model messaging resonated with poor",
      "Deployed Kenyan police to Haiti to restore security",
      "IMF programme maintained — fiscal consolidation attempted",
      "Kenya positioned as key US strategic partner in East Africa",
    ],
    politicalViews:
      "Conservative, pro-business, US-aligned. Bottom-up economics messaging versus austerity reality. Strong military cooperation with West. Anti-corruption rhetoric vs patronage network realities.",
    approvalRating: 27,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "His dramatic climbdown on the Finance Bill under protest pressure marks the most significant youth-led accountability moment in sub-Saharan Africa in a generation.",
    region: "Africa",
  },
  {
    id: "goita",
    name: "Assimi Goïta",
    country: "Mali",
    countryCode: "ML",
    flag: "🇲🇱",
    title: "President (Transitional)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Assimi_Go%C3%AFta_2021_%28cropped%29.jpg/440px-Assimi_Go%C3%AFta_2021_%28cropped%29.jpg",
    age: 41,
    birthYear: 1983,
    birthPlace: "Kati, Koulikoro, Mali",
    education: [
      {
        institution: "Military Academy of Kati",
        degree: "Military Studies",
        year: 2002,
      },
    ],
    party: "Military junta (CNSP / CNRDRE)",
    ideology: "Military Junta",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Special forces colonel who led two coups in 9 months (August 2020 and May 2021). Expelled French Barkhane forces, UN peacekeeping mission (MINUSMA), and invited Wagner Group (now Africa Corps). Part of a wave of anti-French coups across the Sahel.",
    significantEvents: [
      {
        year: 2020,
        event: "First coup overthrows elected President Keïta",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Second coup removes transitional PM; Goïta becomes transitional president",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Wagner Group (Russia) troops deployed after French forces expelled",
        impact: "neutral",
      },
      {
        year: 2023,
        event: "MINUSMA (UN) peacekeepers expelled from Mali",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Alliance of Sahel States (Mali, Burkina, Niger) formed — leaves ECOWAS",
        impact: "negative",
      },
    ],
    achievements: [
      "Expelled French military — delivered on domestic anti-France sentiment",
      "Formed Alliance of Sahel States — new regional bloc",
      "Maintains national sovereignty framing despite security deterioration",
    ],
    politicalViews:
      "Anti-French, anti-ECOWAS, pro-Russia military partnership. Pan-Africanism as cover for authoritarian consolidation. No democratic transition timeline despite promises.",
    approvalRating: 48,
    approvalTrend: "stable",
    status: "Transitional",
    impact:
      "Epitomises the Sahel&#39;s anti-French coup wave. Mali&#39;s security situation has worsened under Wagner support, with jihadist control expanding. His Russia pivot is part of a geopolitical realignment of West Africa away from the West.",
    region: "Africa",
  },
  {
    id: "traore",
    name: "Ibrahim Traoré",
    country: "Burkina Faso",
    countryCode: "BF",
    flag: "🇧🇫",
    title: "President (Transitional)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Ibrahim_Traore_2022_%28cropped%29.jpg/440px-Ibrahim_Traore_2022_%28cropped%29.jpg",
    age: 36,
    birthYear: 1988,
    birthPlace: "Bondokuy, Burkina Faso",
    education: [
      {
        institution: "Military Academy of Kati, Mali",
        degree: "Military Training",
        year: 2007,
      },
    ],
    party: "Military junta (MPSR II)",
    ideology: "Military Junta",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Captain who became one of Africa&#39;s youngest heads of state at 34 after leading Burkina Faso&#39;s second coup of 2022. Expelled French forces, invited Wagner/Africa Corps and became a social media celebrity among Pan-Africanist youth despite worsening jihadist violence.",
    significantEvents: [
      {
        year: 2022,
        event: "Led second coup of year; became president at age 34",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Expelled French Sabre special forces troops",
        impact: "neutral",
      },
      {
        year: 2023,
        event: "Joined Alliance of Sahel States with Mali and Niger",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Jihadist blockade of Barsalogho kills 200+ civilians",
        impact: "negative",
      },
    ],
    achievements: [
      "Expressed authentic anti-colonial sentiment that resonated across Africa",
      "Maintained state control despite severe jihadist insurgency",
      "Alliance of Sahel States formation",
    ],
    politicalViews:
      "Pan-Africanist, anti-imperialist, pro-Russia security partnership. Frames governance as resistance to Western neo-colonialism. No transition timeline.",
    approvalRating: null,
    approvalTrend: "down",
    status: "Transitional",
    impact:
      "Burkina Faso&#39;s security situation dramatically worsened under his rule — 40% of territory effectively outside state control. His social media popularity among African youth exceeds his governance reality.",
    region: "Africa",
  },
  // ── BATCH 10: Asia completion ──────────────────────────────────────────────
  {
    id: "phamminchinh",
    name: "Pham Minh Chinh",
    country: "Vietnam",
    countryCode: "VN",
    flag: "🇻🇳",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Ph%E1%BA%A1m_Minh_Ch%C3%ADnh_2021_official_portrait.jpg/440px-Ph%E1%BA%A1m_Minh_Ch%C3%ADnh_2021_official_portrait.jpg",
    age: 65,
    birthYear: 1958,
    birthPlace: "Thanh Hóa Province, Vietnam",
    education: [
      {
        institution: "Vietnam Police Academy",
        degree: "Law Studies",
        year: 1986,
      },
      {
        institution: "Vietnam Academy of Finance",
        degree: "Economics",
        year: 1993,
      },
    ],
    party: "Communist Party of Vietnam (CPV)",
    ideology: "Communist",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Former security and intelligence official who became PM in 2021. Vietnam has pursued a multi-directional foreign policy (doi ngoai da phuong) balancing US, China, Russia, and India ties — the &#39;bamboo diplomacy&#39; strategy. Vietnam&#39;s economy is one of Asia&#39;s fastest-growing.",
    significantEvents: [
      {
        year: 2021,
        event: "Became Prime Minister — party re-confirmed top positions",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Vietnam elevated to Comprehensive Strategic Partnership with US",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Same elevated partnership with China; bamboo diplomacy peak",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Vietnam&#39;s Dot Dieu anti-corruption campaign — top leaders jailed",
        impact: "positive",
      },
    ],
    achievements: [
      "Vietnam&#39;s GDP growth of 7%+ — among Asia&#39;s fastest",
      "Comprehensive Strategic Partnerships with both US and China",
      "Manufacturing hub shift from China accelerated under his tenure",
      "Major semiconductor and tech FDI attracted",
    ],
    politicalViews:
      "Communist developmentalism, pragmatic economic engagement. Bamboo diplomacy — bends but doesn&#39;t break, tilts with all partners. South China Sea disputes managed through ASEAN and bilateral channels without direct confrontation.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Oversees Vietnam&#39;s emergence as a key manufacturing alternative to China and one of SE Asia&#39;s most important growth stories — while maintaining one-party communist governance.",
    region: "Asia-Pacific",
  },
  {
    id: "hunmanet",
    name: "Hun Manet",
    country: "Cambodia",
    countryCode: "KH",
    flag: "🇰🇭",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Hun_Manet_2023_official_portrait.jpg/440px-Hun_Manet_2023_official_portrait.jpg",
    age: 46,
    birthYear: 1977,
    birthPlace: "Phnom Penh, Cambodia",
    education: [
      {
        institution: "West Point (US Military Academy)",
        degree: "B.Sc. Economics",
        year: 1999,
      },
      { institution: "NYU", degree: "M.Sc. Economics", year: 2002 },
      {
        institution: "University of Bristol",
        degree: "Ph.D. Economics",
        year: 2019,
      },
    ],
    party: "Cambodian People&#39;s Party (CPP)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Son of former strongman Hun Sen who ruled Cambodia for 38 years. Credentialed at West Point and NYU — a technocratic facade on a nepo-state transition. Took power in August 2023 after his father&#39;s orchestrated &#39;abdication&#39;. First Cambodian PM to hold a US military academy degree.",
    significantEvents: [
      {
        year: 2023,
        event: "Became PM after father Hun Sen staged managed transition",
        impact: "neutral",
      },
      {
        year: 2023,
        event: "July elections — CPP won all 125 seats after opposition jailed",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Scam Centres crisis — tens of thousands trafficked into fraud compounds",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Cambodia under intense US pressure over Chinese military base in Ream",
        impact: "negative",
      },
    ],
    achievements: [
      "Smooth dynastic power transition — averted instability",
      "Continued Cambodia&#39;s economic growth trajectory",
      "Partial crackdown on Sihanoukville cyber scam compounds",
      "Maintained ASEAN membership and multilateral engagement",
    ],
    politicalViews:
      "CPP one-party state continuation, Cambodia-China deep alignment, pro-Chinese BRI investment. Formally maintains ASEAN non-alignment. Authoritarian governance under technocratic appearance. No political opposition tolerated.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Represents Southeast Asia&#39;s most explicit authoritarian dynastic transition. Cambodia&#39;s scam compound crisis and Chinese military base are defining him as a security concern for the region.",
    region: "Asia-Pacific",
  },
  {
    id: "lee",
    name: "Lawrence Wong",
    country: "Singapore",
    countryCode: "SG",
    flag: "🇸🇬",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Lawrence_Wong_2024_official_portrait.jpg/440px-Lawrence_Wong_2024_official_portrait.jpg",
    age: 52,
    birthYear: 1972,
    birthPlace: "Singapore",
    education: [
      {
        institution: "National University of Singapore",
        degree: "B.Eng. Electrical Engineering",
        year: 1994,
      },
      {
        institution: "University of Michigan",
        degree: "M.Sc. Economics",
        year: 1996,
      },
      {
        institution: "Harvard Kennedy School",
        degree: "M.P.A. (Masters in Public Administration)",
        year: 2005,
      },
    ],
    party: "People&#39;s Action Party (PAP)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Singapore&#39;s 4th Prime Minister, succeeding Lee Hsien Loong who held office for 20 years. Served as co-chair of Singapore&#39;s Multi-Ministry Taskforce during COVID-19 and gained national prominence for his calm, clear communication during the crisis. Harvard-trained economist and career civil servant.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Led Singapore&#39;s COVID-19 response task force — one of Asia&#39;s most effective",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Became Singapore&#39;s 4th PM after Lee Hsien Loong steps down",
        impact: "positive",
      },
      {
        year: 2024,
        event: "PAP wins election with 65% — maintains dominant party rule",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Singapore navigates US–China trade war positioning as neutral hub",
        impact: "neutral",
      },
    ],
    achievements: [
      "Led one of Asia&#39;s best COVID-19 responses",
      "Smooth transition of Singapore&#39;s leadership after 20 years of Lee HL",
      "Singapore remains world&#39;s top financial hub and logistics centre",
      "Maintained Singapore&#39;s AAA credit rating and #1 global competitiveness ranking",
    ],
    politicalViews:
      "PAP technocratic governance — meritocracy, social order, long-term economic planning. Pragmatic balance between US and China. Singapore as indispensable neutral hub in great power competition.",
    approvalRating: 72,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Inherits Singapore&#39;s most difficult geopolitical moment — navigating between US and China in an era of decoupling. His competence-first image gives Singapore strong soft power in a turbulent world.",
    region: "Asia-Pacific",
  },
  {
    id: "muizzu",
    name: "Mohamed Muizzu",
    country: "Maldives",
    countryCode: "MV",
    flag: "🇲🇻",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Mohamed_Muizzu_2023_official_portrait.jpg/440px-Mohamed_Muizzu_2023_official_portrait.jpg",
    age: 45,
    birthYear: 1978,
    birthPlace: "Malé, Maldives",
    education: [
      {
        institution: "University of Moratuwa",
        degree: "B.Sc. Civil Engineering",
        year: 2002,
      },
      {
        institution: "University College London",
        degree: "Ph.D. Civil Engineering",
        year: 2013,
      },
    ],
    party: "People&#39;s National Congress (PNC)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Mohamed Muizzu — former Mayor of Malé who won the 2023 presidential election on an India Out campaign. Expelled Indian military personnel from the Maldives and tilted sharply toward China, which built critical infrastructure across the island nation.",
    significantEvents: [
      {
        year: 2023,
        event: "Won election on &#39;India Out&#39; anti-India platform",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Expelled Indian military personnel; reset foreign policy toward China",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Signed Free Trade Agreement with China — first for Maldives",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "India–Maldives tensions remain elevated; tourism revenue affected",
        impact: "negative",
      },
    ],
    achievements: [
      "Maldives&#39; first China FTA signed",
      "Expanded Chinese infrastructure investment in Maldives",
      "Maintained tourism as GDP pillar despite diplomatic tensions",
      "Navigated India–China tug-of-war over small island state",
    ],
    politicalViews:
      "Pro-China pivot, Maldivian sovereignty, Islamic identity politics. Opposes Indian military presence. Sees China as development partner over India&#39;s regional hegemony. Climate vulnerability — sea level rise existential issue.",
    approvalRating: 46,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Maldives&#39; China pivot is a symbolic and strategic blow to India&#39;s Indian Ocean dominance. His country&#39;s existential vulnerability to climate change gives him unusual global leverage on environmental issues.",
    region: "Asia-Pacific",
  },
  // ── BATCH 11: Final Europe + LA Completion ──────────────────────────────────
  {
    id: "christodoulides",
    name: "Nikos Christodoulides",
    country: "Cyprus",
    countryCode: "CY",
    flag: "🇨🇾",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Nikos_Christodoulides_2023.jpg/440px-Nikos_Christodoulides_2023.jpg",
    age: 49,
    birthYear: 1976,
    birthPlace: "Paphos, Cyprus",
    education: [
      {
        institution: "University of Exeter",
        degree: "B.Sc. European Studies",
        year: 1998,
      },
      {
        institution: "Free University of Brussels (VUB)",
        degree: "M.A. European Studies",
        year: 2000,
      },
    ],
    party: "Independent (formerly DISY)",
    ideology: "Centrist",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Former Foreign Minister who won the 2023 election as an independent, breaking from the ruling right-wing DISY party. Cyprus sits at the nexus of EU, Middle East, Russia, and Israel geopolitics — the island served as a key route for Gaza aid and hostage negotiations.",
    significantEvents: [
      {
        year: 2023,
        event: "Won presidential election as independent — broke from DISY",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Gaza war — Cyprus opened maritime corridor for UK aid route",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Managed unprecedented Gaza aid corridor through Larnaca port",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Reunification talks with north Cyprus and Turkey restarted",
        impact: "neutral",
      },
    ],
    achievements: [
      "Opened Cyprus humanitarian corridor for Gaza aid shipping",
      "Reunification talks restarted after years of stalemate",
      "EU&#39;s Gaza aid floating pier concept championed",
      "Cyprus positioned as indispensable Eastern Med humanitarian hub",
    ],
    politicalViews:
      "Centrist, pro-EU, pro-UN settlement of Cyprus dispute. Close Israel ties but Gaza aid balancing. Russia legacy (offshore banking) being regulated. Eastern Mediterranean gas exploration advocate.",
    approvalRating: 54,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governed Cyprus through the most geopolitically intense period since the 1974 Turkish invasion. The Gaza maritime corridor cemented Cyprus as an indispensable humanitarian actor in the Middle East crisis.",
    region: "Europe",
  },
  {
    id: "orban",
    name: "Viktor Orbán",
    country: "Hungary",
    countryCode: "HU",
    flag: "🇭🇺",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Orb%C3%A1n_Viktor_2019_cropped.jpg/440px-Orb%C3%A1n_Viktor_2019_cropped.jpg",
    age: 62,
    birthYear: 1963,
    birthPlace: "Székesfehérvár, Hungary",
    education: [
      {
        institution: "Eötvös Loránd University",
        degree: "Law Degree",
        year: 1987,
      },
      {
        institution: "Pembroke College, Oxford",
        degree: "Research scholarship (incomplete)",
        year: 1989,
      },
    ],
    party: "Fidesz – Hungarian Civic Alliance",
    ideology: "Nationalist",
    termsInOffice: [
      { from: 1998, to: 2002 },
      { from: 2010, to: "present" },
    ],
    background:
      "Former anti-communist liberal activist who sharply pivoted to illiberal nationalism. Has systematically reshaped Hungary&#39;s judicial, media, and electoral systems in Fidesz&#39;s favour. Often described as the EU&#39;s only illiberal democracy and Putin&#39;s closest European ally.",
    significantEvents: [
      {
        year: 2010,
        event:
          "Returned to power with supermajority; began constitutional restructuring",
        impact: "neutral",
      },
      {
        year: 2015,
        event:
          "Built border fence; rejected EU refugee quotas — became anti-migration figurehead",
        impact: "neutral",
      },
      {
        year: 2022,
        event:
          "Won fourth consecutive term; vetoed EU aid to Ukraine repeatedly",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Visited Moscow and Beijing — broke EU consensus on Ukraine war",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Hungary holds EU Council presidency; used to push Putin peace plan",
        impact: "negative",
      },
    ],
    achievements: [
      "Longest-serving current EU leader",
      "Hungary&#39;s economy grew 4%+ annually pre-COVID",
      "Family policy: Hungary&#39;s birth rate increased",
      "Maintains cheapest energy in EU through Russian gas deal",
    ],
    politicalViews:
      "Illiberal national conservatism, Christian democracy, anti-immigration, anti-LGBTQ legislation, pro-Russia energy dependency. Defines himself against 'Brussels&#39; and Western liberal values. Trumpist before Trump.",
    approvalRating: 49,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Proven template for a new breed of European nationalism. His media control and constitutional engineering have become a playbook for populists globally. Most disruptive EU member on Ukraine policy.",
    region: "Europe",
  },
  // ── BATCH 12: Missing Major Leaders ────────────────────────────────────────
  {
    id: "merz",
    name: "Friedrich Merz",
    country: "Germany",
    countryCode: "DE",
    flag: "🇩🇪",
    title: "Chancellor",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Friedrich_Merz%2C_MdB_-_Profil_01_%28cropped%29.jpg/440px-Friedrich_Merz%2C_MdB_-_Profil_01_%28cropped%29.jpg",
    age: 69,
    birthYear: 1955,
    birthPlace: "Brilon, North Rhine-Westphalia, Germany",
    education: [
      { institution: "University of Bonn", degree: "B.A. Law", year: 1980 },
      {
        institution: "University of Marburg",
        degree: "First State Exam in Law",
        year: 1982,
      },
      {
        institution: "University of Bonn",
        degree: "Second State Exam & Ph.D. Law",
        year: 1985,
      },
    ],
    party: "Christian Democratic Union (CDU)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2025, to: "present" }],
    background:
      "Corporate lawyer and former Bundestag member who spent years at BlackRock Germany before returning to politics. Won the CDU leadership after Merkel&#39;s departure and led the CDU/CSU to victory in the February 2025 snap elections following Scholz&#39;s coalition collapse. Became Chancellor in March 2025.",
    significantEvents: [
      {
        year: 2000,
        event:
          "Lost CDU leadership battle to Angela Merkel — went to corporate world",
        impact: "negative",
      },
      {
        year: 2021,
        event: "Returned to politics; won CDU leadership",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Led CDU/CSU to election victory after Scholz coalition collapse",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Became Chancellor; launched €500B infrastructure investment fund",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Passed historic constitutional debt brake reform for defence spending",
        impact: "positive",
      },
    ],
    achievements: [
      "Became Chancellor after 16 years of CDU opposition waiting",
      "Debt brake reform — unlocked €500B infrastructure and defence fund",
      "Germany&#39;s fastest defence budget increase since reunification",
      "Rebuilt CDU as Germany&#39;s dominant party post-Merkel",
    ],
    politicalViews:
      "Traditional CDU conservatism — fiscal discipline (before the debt brake reform), pro-business, Atlantic alliance, tough on immigration and crime. More hawkish than Scholz on Russia and China. Advocates German leadership in European defence.",
    approvalRating: 43,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Inherited Germany at its most uncertain moment since reunification — energy crisis legacy, stagnant economy, rearmament demands. His debt brake reform could prove the most consequential economic policy shift in Germany in a generation.",
    region: "Europe",
  },
  {
    id: "lee-jm",
    name: "Lee Jae-myung",
    country: "South Korea",
    countryCode: "KR",
    flag: "🇰🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Lee_Jae-myung_2022.jpg/440px-Lee_Jae-myung_2022.jpg",
    age: 61,
    birthYear: 1964,
    birthPlace: "Andong, North Gyeongsang Province, South Korea",
    education: [
      { institution: "Chung-Ang University", degree: "B.A. Law", year: 1986 },
      { institution: "Chung-Ang University", degree: "M.A. Law", year: 1988 },
    ],
    party: "Democratic Party of Korea",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2025, to: "present" }],
    background:
      "Former Governor of Gyeonggi Province and multiple-time presidential candidate. Rose from extreme poverty — worked in a factory from age 12, losing a finger in an industrial accident. Won the June 2025 snap presidential election following Yoon Suk-yeol&#39;s impeachment and removal after his short-lived martial law declaration.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Narrowly lost presidential election to Yoon Suk-yeol by 0.7% — closest in Korean history",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Survived assassination knife attack at press event",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Won snap presidential election after Yoon&#39;s constitutional crisis",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Restored inter-Korean humanitarian dialogue",
        impact: "positive",
      },
    ],
    achievements: [
      "Won presidency after surviving assassination attempt",
      "Launched basic income pilot as Gyeonggi Governor",
      "Restored South Korea&#39;s democratic continuity after constitutional crisis",
      "Re-engaged North Korea on humanitarian channels",
    ],
    politicalViews:
      "Progressive social democrat, universal basic income advocate, pro-welfare expansion. Engagement with North Korea. More sceptical of Japan than conservatives. Pro-US alliance but wants more South Korean strategic autonomy.",
    approvalRating: 54,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Inherited the most politically fractured South Korea since democratisation. His victory closes one of the most extraordinary constitutional crises in modern Asian democratic history.",
    region: "Asia-Pacific",
  },
  {
    id: "boric",
    name: "Gabriel Boric",
    country: "Chile",
    countryCode: "CL",
    flag: "🇨🇱",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Gabriel_Boric_2022_official_portrait.jpg/440px-Gabriel_Boric_2022_official_portrait.jpg",
    age: 39,
    birthYear: 1986,
    birthPlace: "Punta Arenas, Magallanes Region, Chile",
    education: [
      {
        institution: "University of Chile",
        degree: "B.A. Law (incomplete)",
        year: 2010,
      },
    ],
    party: "Convergencia Social / Frente Amplio",
    ideology: "Progressive",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Former student movement leader and congressman who became Chile&#39;s youngest-ever president at 35 in March 2022. Emerged from the 2019 social uprising that demanded constitutional reform. Governing Chile through a turbulent period of rejected constitutional referendums and rising crime.",
    significantEvents: [
      {
        year: 2011,
        event:
          "Led massive student protests for free education — became national figure",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Won runoff defeating far-right Kast — became Chile&#39;s youngest president",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "First constitutional draft rejected in referendum — 62% voted against",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Second constitutional draft (right-wing) also rejected in referendum",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Rising crime and immigration become dominant political issues",
        impact: "negative",
      },
    ],
    achievements: [
      "Youngest Chilean president and youngest head of government in South America",
      "Advanced universal pension reform despite constitutional failures",
      "Lithium nationalisation strategy for state stake in mining",
      "40-hour work week legislation passed",
    ],
    politicalViews:
      "Democratic socialist, feminist, environmentalist. Anti-authoritarianism — has criticised Cuba, Venezuela, and Nicaragua despite left roots. Supports free healthcare and education, lithium state ownership. Pragmatically shifted centre from radical student days.",
    approvalRating: 36,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His presidency exemplifies the limits of progressive governance in Latin America — failed constitutional referendums, rising crime, and coalition fragility. Yet his democratic principles and self-correction mark him as a serious statesman.",
    region: "Americas",
  },
  {
    id: "abdullah2",
    name: "King Abdullah II",
    country: "Jordan",
    countryCode: "JO",
    flag: "🇯🇴",
    title: "King",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/King_Abdullah_II_of_Jordan_%28cropped%29.jpg/440px-King_Abdullah_II_of_Jordan_%28cropped%29.jpg",
    age: 63,
    birthYear: 1962,
    birthPlace: "Amman, Jordan",
    education: [
      {
        institution: "Royal Military Academy Sandhurst",
        degree: "Officer Training",
        year: 1980,
      },
      {
        institution: "Oxford University (Magdalen College)",
        degree: "M.A. International Relations",
        year: 1984,
      },
      {
        institution: "Georgetown University",
        degree: "Foreign Service Studies",
        year: 1987,
      },
    ],
    party: "Hashemite Monarchy",
    ideology: "Monarchy",
    termsInOffice: [{ from: 1999, to: "present" }],
    background:
      "Son of King Hussein who ascended the throne in 1999. A Sandhurst-trained military officer and former special forces commander, Abdullah has navigated Jordan through the Arab Spring, Syrian refugee crisis, and Gaza war while maintaining the peace treaty with Israel.",
    significantEvents: [
      {
        year: 2003,
        event: "Jordan opposed the Iraq War — strain on US relations",
        impact: "neutral",
      },
      {
        year: 2011,
        event:
          "Arab Spring — limited reforms forestalled major instability in Jordan",
        impact: "positive",
      },
      {
        year: 2015,
        event:
          "Jordanian pilot burned alive by ISIS — Jordan escalated strikes",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Gaza war — Jordan first Arab state to intercept Iranian drones targeting Israel",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Jordan hosts major Gaza ceasefire diplomacy summits",
        impact: "positive",
      },
    ],
    achievements: [
      "Jordan&#39;s stability maintained through 25+ years of regional chaos",
      "Hosts 1.3M+ Syrian refugees — world&#39;s second-highest per capita",
      "Peace treaty with Israel maintained despite intense popular opposition",
      "Intercepted Iranian drones in April 2024 — rare military action in defense of Israel",
    ],
    politicalViews:
      "Hashemite constitutional monarchy. Pro-Western alliance, moderate Islam, Palestinian two-state solution advocate. Pragmatic — maintains Israel relations while defending Palestinian cause. Balances US, Arab Gulf, and Palestinian interests.",
    approvalRating: 58,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Jordan&#39;s stability in one of the world&#39;s most volatile regions is Abdullah&#39;s remarkable achievement. The kingdom is the linchpin of Middle Eastern diplomacy — without it, refugee crises, ISIS containment, and Israeli–Arab dialogue would all worsen dramatically.",
    region: "Middle East",
  },
  {
    id: "tamim",
    name: "Tamim bin Hamad Al Thani",
    country: "Qatar",
    countryCode: "QA",
    flag: "🇶🇦",
    title: "Emir",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/HH_Sheikh_Tamim_bin_Hamad_Al_Thani%2C_Emir_of_Qatar.jpg/440px-HH_Sheikh_Tamim_bin_Hamad_Al_Thani%2C_Emir_of_Qatar.jpg",
    age: 44,
    birthYear: 1980,
    birthPlace: "Doha, Qatar",
    education: [
      {
        institution: "Royal Military Academy Sandhurst",
        degree: "Officer Training",
        year: 1998,
      },
      {
        institution: "University of Exeter",
        degree: "B.A. Political Science",
        year: 2001,
      },
    ],
    party: "House of Thani (monarchy)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2013, to: "present" }],
    background:
      "Became Emir at 33 after his father Sheikh Hamad abdicated. Oversaw the 2022 FIFA World Cup — Qatar&#39;s most globally visible moment. Hosts Al Jazeera Arabic, Hamas political bureau, and US CENTCOM&#39;s regional headquarters simultaneously — making Qatar the world&#39;s most ambitious small-state geopolitical broker.",
    significantEvents: [
      {
        year: 2017,
        event: "Saudi/UAE/Egypt blockade of Qatar — stood firm for 3.5 years",
        impact: "negative",
      },
      {
        year: 2021,
        event: "Blockade lifted after Al-Ula Declaration",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "FIFA World Cup 2022 hosted — first Arab nation to host World Cup",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Qatar mediates Hamas–Israel hostage and ceasefire talks in Doha",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Key broker in Gaza ceasefire agreements with Egypt and US",
        impact: "positive",
      },
    ],
    achievements: [
      "Hosted FIFA World Cup 2022 — first Arab country ever",
      "Survived 3.5-year Saudi-led blockade without capitulating",
      "Al Jazeera established as world&#39;s most watched Arabic news network",
      "Gaza peace mediation — co-hosted all major 2024–25 ceasefire talks",
    ],
    politicalViews:
      "Pragmatic dynastic authoritarian. Hosts contradictory relationships simultaneously — Al Jazeera (critical), US CENTCOM (strategic), Hamas (diplomatic channel), Israel (back-channel). Non-alignment as strategy to maximise leverage. Uses natural gas wealth for outsider geopolitical influence.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Qatar punches far above its weight. A nation of 300,000 citizens that holds more global diplomatic leverage than most G20 states — due to gas wealth, strategic hosting, and willingness to talk to everyone.",
    region: "Middle East",
  },
  {
    id: "frederiksen",
    name: "Mette Frederiksen",
    country: "Denmark",
    countryCode: "DK",
    flag: "🇩🇰",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Mette_Frederiksen_2019_%28cropped%29.jpg/440px-Mette_Frederiksen_2019_%28cropped%29.jpg",
    age: 47,
    birthYear: 1977,
    birthPlace: "Copenhagen, Denmark",
    education: [
      {
        institution: "Roskilde University",
        degree: "B.A. Administration (incomplete)",
        year: 2000,
      },
    ],
    party: "Social Democrats",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Former youth socialism activist who became Denmark&#39;s youngest-ever Prime Minister at 41. Defied social democratic convention by coupling tough immigration rhetoric with expanded welfare — dubbed the 'welfare nationalist'. Led Denmark through COVID with one of Europe&#39;s strongest records.",
    significantEvents: [
      {
        year: 2019,
        event: "Became Denmark&#39;s youngest PM at 41",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "Mink culling — 17M mink ordered killed over COVID mutation fears",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Re-elected; Denmark referendum votes to join EU defence frameworks",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Greenland sovereignty debate — resists Trump&#39;s acquisition rhetoric",
        impact: "positive",
      },
    ],
    achievements: [
      "Denmark&#39;s COVID mortality among Europe&#39;s lowest",
      "Voters approved removal of Danish EU defence opt-out — historic referendum",
      "Denmark&#39;s energy self-sufficiency goals accelerated",
      "Greenland sovereignty defended against US pressure",
    ],
    politicalViews:
      "Welfare nationalist — strict immigration + generous welfare state. Pro-NATO, strong Ukraine support, pro-EU defence integration. Climate ambitious. Unusual combination of left economics and restrictive immigration that defines a new European centre-left model.",
    approvalRating: 52,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Her &#39;welfare nationalism&#39; model has influenced centre-left parties across Europe navigating the migration debate. Defending Greenland&#39;s sovereignty has given Denmark an outsized role in Arctic geopolitics.",
    region: "Europe",
  },
  {
    id: "faye",
    name: "Bassirou Diomaye Faye",
    country: "Senegal",
    countryCode: "SN",
    flag: "🇸🇳",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Bassirou_Diomaye_Faye_2024_official_portrait.jpg/440px-Bassirou_Diomaye_Faye_2024_official_portrait.jpg",
    age: 44,
    birthYear: 1980,
    birthPlace: "Ndiaganiao, Thiès Region, Senegal",
    education: [
      {
        institution: "Cheikh Anta Diop University",
        degree: "B.A. Law",
        year: 2003,
      },
      {
        institution: "National School of Administration and Magistracy (ENAM)",
        degree: "Tax Inspector",
        year: 2006,
      },
    ],
    party: "PASTEF (Patriots of Senegal for Work, Ethics and Fraternity)",
    ideology: "Progressive",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Former tax inspector who was released from prison just 10 days before winning Senegal&#39;s March 2024 presidential election — the most dramatic electoral comeback in African politics in decades. Closely allied with opposition figure Ousmane Sonko, who was barred from running. Won with 54% as the anti-establishment candidate.",
    significantEvents: [
      {
        year: 2023,
        event: "Jailed on charges widely condemned as political persecution",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Released from prison 10 days before election; won with 54%",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Announced renegotiation of oil and mining contracts with foreign companies",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Launched Senegal&#39;s oil and gas first production — transformative revenue source",
        impact: "positive",
      },
    ],
    achievements: [
      "Won presidency 10 days after prison release — historic democratic moment",
      "Launched Senegal&#39;s first oil & gas production era",
      "Resource sovereignty renegotiations with Western energy companies",
      "Wolof and Diola cultural identity elevated alongside French",
    ],
    politicalViews:
      "Pan-Africanist, resource sovereigntist, anti-colonial in economics. Advocates African monetary independence from CFA franc. Pro-South-South cooperation, scrutinises French economic dominance. Democratic institutions defender.",
    approvalRating: 61,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Symbolises a new generation of African leaders elected on genuine anti-corruption mandates. Senegal&#39;s new oil wealth under his watch will test whether resource sovereignty rhetoric translates to equitable development.",
    region: "Africa",
  },
  {
    id: "tshisekedi",
    name: "Félix Tshisekedi",
    country: "Dem. Rep. of Congo",
    countryCode: "CD",
    flag: "🇨🇩",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/F%C3%A9lix_Tshisekedi_%28cropped%29.jpg/440px-F%C3%A9lix_Tshisekedi_%28cropped%29.jpg",
    age: 61,
    birthYear: 1963,
    birthPlace: "Kinshasa, Democratic Republic of Congo",
    education: [
      {
        institution: "Institut Supérieur de Commerce de Kinshasa",
        degree: "Business Studies",
        year: 1987,
      },
    ],
    party: "Union for Democracy and Social Progress (UDPS)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Son of legendary DRC opposition figure Étienne Tshisekedi. Won the 2018 election in a disputed process and was re-elected in contested 2023 elections. Leads the world&#39;s most resource-rich yet conflict-devastated large nation — the DRC has the world&#39;s largest cobalt reserves but its eastern regions remain locked in devastating armed conflict.",
    significantEvents: [
      {
        year: 2019,
        event:
          "Assumed presidency in DRC&#39;s first peaceful power transfer since independence",
        impact: "positive",
      },
      {
        year: 2021,
        event:
          "Declared state of siege in eastern DRC as M23/Rwanda conflict escalates",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Re-elected in disputed vote; M23 advance on Goma intensifies",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Luanda peace process; US minerals-for-security deal discussions",
        impact: "neutral",
      },
    ],
    achievements: [
      "First peaceful DRC leadership transition since independence in 1960",
      "Free primary education programme launched",
      "DRC admitted to East African Community — new trade integration",
      "US minerals-for-security agreement framework advanced",
    ],
    politicalViews:
      "Social democratic, DRC sovereignty, pro-Western investment. Seeks foreign investment in cobalt, coltan, lithium mining. Accuses Rwanda of backing M23 rebels — UN reports support this. African Union peace process engagement.",
    approvalRating: 34,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Leads one of the world&#39;s most consequential but overlooked crises — the DRC&#39;s eastern conflict has killed more people than any war since WWII. Its mineral wealth will define the global electric vehicle and renewable energy transition.",
    region: "Africa",
  },
  {
    id: "minaungHlaing",
    name: "Min Aung Hlaing",
    country: "Myanmar",
    countryCode: "MM",
    flag: "🇲🇲",
    title: "Senior General / Prime Minister (SAC)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Min_Aung_Hlaing_%282019%29.jpg/440px-Min_Aung_Hlaing_%282019%29.jpg",
    age: 67,
    birthYear: 1956,
    birthPlace: "Tavoy (Dawei), Tenasserim Division, Burma",
    education: [
      {
        institution: "Defence Services Academy (DSA)",
        degree: "Military Studies",
        year: 1977,
      },
      {
        institution: "Defence Services Command and Staff College",
        degree: "Advanced Military Studies",
        year: 1994,
      },
    ],
    party: "State Administration Council (Military Junta)",
    ideology: "Military Junta",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Commander-in-Chief who led the February 2021 coup against the elected NLD government, arresting Aung San Suu Kyi. Oversaw the 2017 Rohingya genocide before becoming de facto ruler. Now faces a nationwide resistance war he is losing — the Myanmar military (Tatmadaw) controls less than 50% of the country as of 2025.",
    significantEvents: [
      {
        year: 2017,
        event:
          "Led Rohingya military crackdown — UN labelled it genocide; 700,000+ fled to Bangladesh",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Launched coup on election day; arrested Suu Kyi and won NLD government",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Charged Suu Kyi with 27 offences; sentenced to 27 years in prison",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Operation 1027 — coordinated resistance offensive captures major towns",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Military losing control of major cities; three-way resistance war continues",
        impact: "negative",
      },
    ],
    achievements: [
      "Maintained junta control despite nationwide civil war",
      "Retained China and Russia diplomatic support blocking UN action",
      "Kept Tatmadaw as functioning military institution despite mass defections",
    ],
    politicalViews:
      "Military nationalist, Buddhist nationalist, absolute military rule. Anti-democratic. Patron-client economic model favouring military conglomerates. Deeply opposed to federalism for ethnic minorities.",
    approvalRating: null,
    approvalTrend: "down",
    status: "Transitional",
    impact:
      "Triggered one of Asia&#39;s worst humanitarian crises since the Vietnam War. His coup destroyed Myanmar&#39;s democratic transition and unleashed a resistance movement he cannot defeat but refuses to negotiate with.",
    region: "Asia-Pacific",
  },
  {
    id: "stubb",
    name: "Alexander Stubb",
    country: "Finland",
    countryCode: "FI",
    flag: "🇫🇮",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Alexander_Stubb_2024_official_portrait.jpg/440px-Alexander_Stubb_2024_official_portrait.jpg",
    age: 57,
    birthYear: 1968,
    birthPlace: "Helsinki, Finland",
    education: [
      {
        institution: "Furman University (USA)",
        degree: "B.A. Political Science / French",
        year: 1991,
      },
      {
        institution: "Helsinki School of Economics",
        degree: "M.Sc. Economics",
        year: 1993,
      },
      {
        institution: "European University Institute, Florence",
        degree: "Ph.D. International Relations",
        year: 1999,
      },
    ],
    party: "National Coalition Party (NCP)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Fluent in five languages and an Ironman triathlete, Stubb is one of Europe&#39;s most cosmopolitan political figures. Former PM, Finance Minister, and Foreign Minister of Finland who won the presidency in February 2024 — just months before Finland&#39;s first full NATO year under Orpo&#39;s government. A passionate Atlanticist with deep transatlantic network.",
    significantEvents: [
      {
        year: 2019,
        event: "Appointed Vice-President of European Investment Bank",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Won Finnish presidential election — became President in March 2024",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "First state visit to Washington to reinforce Finland&#39;s new NATO role",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Represents Finland on the NATO eastern flank security at presidential level",
        impact: "positive",
      },
    ],
    achievements: [
      "Won Finland&#39;s presidency on first attempt against veteran politicians",
      "Championed Finland&#39;s NATO accession for years before it happened",
      "EIB Vice-President — financial diplomacy expertise",
      "Ironman triathlete — visible public health advocate",
    ],
    politicalViews:
      "Conservative liberal internationalist, pro-NATO, pro-EU, pro-Ukraine. Transatlanticist who believes strongly in US security commitment to Europe. Politically more liberal than PM Orpo on social issues. Climate-conscious.",
    approvalRating: 68,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "As President of NATO&#39;s most exposed member-state, his role in managing the 1,300km Russian border relationship has outsized European security implications. Among Europe&#39;s most credible faces for the US–Europe security conversation.",
    region: "Europe",
  },
  // ── BATCH 13: Europe continuation + Oceania ────────────────────────────────
  {
    id: "bayrou",
    name: "François Bayrou",
    country: "France",
    countryCode: "FR",
    flag: "🇫🇷",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Fran%C3%A7ois_Bayrou_2022_%28cropped%29.jpg/440px-Fran%C3%A7ois_Bayrou_2022_%28cropped%29.jpg",
    age: 73,
    birthYear: 1951,
    birthPlace: "Bordeaux, France",
    education: [
      {
        institution: "University of Paris IV (Sorbonne)",
        degree: "Agrégation in Modern Literature",
        year: 1977,
      },
    ],
    party: "Democratic Movement (MoDem)",
    ideology: "Centrist",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Veteran centrist politician who ran for president three times (2002, 2007, 2012) before becoming Macron&#39;s closest political ally. Appointed Prime Minister in December 2024 after Michel Barnier&#39;s government fell on a no-confidence vote — the third PM Macron has gone through. Mayor of Pau since 1993.",
    significantEvents: [
      {
        year: 2002,
        event:
          "Ran for president — made third place with 6.8% in an upset election",
        impact: "neutral",
      },
      {
        year: 2007,
        event:
          "Presidential run — historic 18.6% denied Sarkozy first-round win",
        impact: "positive",
      },
      {
        year: 2017,
        event: "Allied with Macron and joined En Marche government briefly",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Appointed PM after Barnier&#39;s government fell on no-confidence",
        impact: "neutral",
      },
      {
        year: 2025,
        event: "Survived multiple no-confidence attempts; budget passed",
        impact: "positive",
      },
    ],
    achievements: [
      "Longest political career of any French serving centrist",
      "Founded MoDem — France&#39;s most durable centrist party",
      "Survived as PM despite minority government in hostile parliament",
      "Mayor of Pau for 30+ years — one of France&#39;s longest-serving mayors",
    ],
    politicalViews:
      "Christian democratic centrist. Pro-European integration, proportional representation advocate, institutional reform. Catholic social teaching influences. Supports Macron&#39;s agenda while pushing for broader coalition.",
    approvalRating: 22,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "France&#39;s parliamentary crisis has made the PM role nearly impossible. Bayrou&#39;s political longevity and centrism make him better positioned than predecessors — but France&#39;s fragmented National Assembly fundamentally limits any PM&#39;s power.",
    region: "Europe",
  },
  {
    id: "luxon",
    name: "Christopher Luxon",
    country: "New Zealand",
    countryCode: "NZ",
    flag: "🇳🇿",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Christopher_Luxon_-_2024.jpg/440px-Christopher_Luxon_-_2024.jpg",
    age: 54,
    birthYear: 1970,
    birthPlace: "Christchurch, New Zealand",
    education: [
      {
        institution: "University of Canterbury",
        degree: "B.Com. Management",
        year: 1993,
      },
    ],
    party: "New Zealand National Party",
    ideology: "Conservative",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Former CEO of Air New Zealand who entered politics in 2020 and became PM after National won the October 2023 election. Governing in coalition with ACT and NZ First. One of the wealthiest NZ PMs — owns seven properties and is an evangelical Christian.",
    significantEvents: [
      {
        year: 2017,
        event: "Appointed CEO of Air New Zealand at 47",
        impact: "positive",
      },
      {
        year: 2020,
        event: "Entered parliament as National MP — meteoric political rise",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Led National to election victory; became PM",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Fast-track infrastructure approvals legislation passed",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Treaty of Waitangi principles bill withdrawn after Maori protests",
        impact: "negative",
      },
    ],
    achievements: [
      "Led Air New Zealand to profitability as CEO",
      "Fast-track infrastructure act to accelerate building consents",
      "Restored fiscal discipline after Labour&#39;s spending period",
      "Free trade agreement with Gulf Cooperation Council negotiated",
    ],
    politicalViews:
      "Centre-right economic liberal. Pro-business deregulation, fiscal restraint, strong US/Five Eyes alliance. Evangelical Christian — socially conservative on some issues. Treaty of Waitangi co-governance sceptic.",
    approvalRating: 38,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Represents a shift back to business-focused governance after six years of Labour. Faces criticism over cost of living crisis and controversial Maori policy reversals that sparked significant protests.",
    region: "Asia-Pacific",
  },
  {
    id: "montenegro-lu",
    name: "Luis Montenegro",
    country: "Portugal",
    countryCode: "PT",
    flag: "🇵🇹",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Lu%C3%ADs_Montenegro_2024_official_portrait.jpg/440px-Lu%C3%ADs_Montenegro_2024_official_portrait.jpg",
    age: 52,
    birthYear: 1973,
    birthPlace: "Espinho, Aveiro, Portugal",
    education: [
      { institution: "University of Coimbra", degree: "B.A. Law", year: 1996 },
      {
        institution: "Catholic University of Portugal",
        degree: "Post-graduation in Public Law",
        year: 1998,
      },
    ],
    party: "Social Democratic Party (PSD) / Democratic Alliance",
    ideology: "Conservative",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Conservative politician who won the March 2024 Portuguese election by a razor-thin margin, ending eight years of Socialist Party government under Costa and Medina. Governs in a minority government — the first right-wing government in Portugal since 2015.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Led PSD as opposition leader through Socialists&#39; absolute majority",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Won March election by 0.1% — historic narrow right-wing victory",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Formed minority government; passed budget with left support",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Navigates EU AI Act and Portugal&#39;s digital economy positioning",
        impact: "neutral",
      },
    ],
    achievements: [
      "Ended eight years of Portuguese Socialist government",
      "First right-wing government in Portugal in a decade",
      "Budget passed with support from rival parties",
      "Tech and digital economy investment programme launched",
    ],
    politicalViews:
      "Centre-right Christian democratic. Pro-EU, pro-NATO, fiscal discipline, business-friendly. More hawkish on immigration than predecessors. Atlantic alliance and transatlantic trade focus.",
    approvalRating: 35,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governing Portugal at a pivotal moment as the country becomes a leading Southern European tech hub. His minority government&#39;s survival depends on fragile parliamentary arithmetic.",
    region: "Europe",
  },
  {
    id: "nehammer",
    name: "Karl Nehammer",
    country: "Austria",
    countryCode: "AT",
    flag: "🇦🇹",
    title: "Former Chancellor",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Karl_Nehammer_2022_%28cropped%29.jpg/440px-Karl_Nehammer_2022_%28cropped%29.jpg",
    age: 52,
    birthYear: 1972,
    birthPlace: "Vienna, Austria",
    education: [
      {
        institution: "Theresian Military Academy",
        degree: "Military Science",
        year: 1995,
      },
      {
        institution: "University of Vienna",
        degree: "B.A. Communication Science",
        year: 2000,
      },
    ],
    party: "Austrian People&#39;s Party (ÖVP)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2021, to: 2025 }],
    background:
      "Former interior minister who became Chancellor in January 2022 after Schallenberg&#39;s brief tenure. Led the ÖVP through the 2024 election which saw the far-right FPÖ come first for the first time in Austrian history. Resigned in January 2025 when coalition negotiations failed and the FPÖ was asked to form government.",
    significantEvents: [
      {
        year: 2022,
        event:
          "One of few Western leaders to visit Putin after Ukraine invasion — for talks",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Austria&#39;s anti-migration policies tightened — asylum applications cut",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "FPÖ wins Austrian election — first far-right first place in history",
        impact: "negative",
      },
      {
        year: 2025,
        event: "Resigned as ÖVP leader after failed coalition negotiations",
        impact: "negative",
      },
    ],
    achievements: [
      "Navigated Austria&#39;s complex COVID response",
      "Maintained Austria&#39;s economic stability as Chancellor",
      "Reduced irregular migration significantly during tenure",
      "Kept Austria&#39;s neutrality status functional during Ukraine war",
    ],
    politicalViews:
      "Conservative Christian democratic, tough on migration, pro-Austrian neutrality. Fiscal discipline, small business support. Refused to form government with FPÖ —ultimately unsuccessfully blocking them.",
    approvalRating: 25,
    approvalTrend: "down",
    status: "Former",
    impact:
      "His refusal to govern with FPÖ after their 2024 victory ultimately failed — the FPÖ formed government with ÖVP under a new Chancellor. Represents the mainstream right&#39;s losing battle against far-right surge across Europe.",
    region: "Europe",
  },
  {
    id: "kickl",
    name: "Herbert Kickl",
    country: "Austria",
    countryCode: "AT",
    flag: "🇦🇹",
    title: "Chancellor",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Herbert_Kickl_2019_%28cropped%29.jpg/440px-Herbert_Kickl_2019_%28cropped%29.jpg",
    age: 56,
    birthYear: 1968,
    birthPlace: "Kirchbach in Steiermark, Austria",
    education: [
      {
        institution: "University of Vienna",
        degree: "Philosophy and History (incomplete)",
        year: 1990,
      },
    ],
    party: "Freedom Party of Austria (FPÖ)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2025, to: "present" }],
    background:
      "FPÖ leader who led his party to first place in the September 2024 Austrian election — the far-right&#39;s first election win in Austrian history. After months of failed coalition talks by ÖVP, was asked by the President to form government in January 2025. Became Chancellor in March 2025 — the first far-right chancellor in Austria in the post-WWII era.",
    significantEvents: [
      {
        year: 2017,
        event:
          "Served as Interior Minister in ÖVP-FPÖ coalition — mass surveillance controversy",
        impact: "negative",
      },
      {
        year: 2019,
        event:
          "FPÖ coalition collapsed after Ibiza Affair scandal — Kickl lost ministry",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Led FPÖ to 29% election win — first far-right first place in Austrian history",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Became Chancellor after forming ÖVP coalition",
        impact: "positive",
      },
    ],
    achievements: [
      "FPÖ&#39;s historic first-place election victory in 2024",
      "Became Austria&#39;s first far-right post-WWII chancellor",
      "Built FPÖ from party in scandal to election winners in 5 years",
      "Implemented strict anti-migration agenda as key campaign promise",
    ],
    politicalViews:
      "Far-right nationalist, anti-immigration absolutist, Eurosceptic, pro-Russia (opposes Ukraine sanctions), anti-COVID mandate legacy. Frames politics as &#39;Fortress Austria&#39;. Opposed to EU federalism and climate regulation mandates.",
    approvalRating: 38,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Represents the mainstreaming of the European far right into actual governance. Austria becomes the first EU founding-orbit country to have an explicitly far-right leader since WWII — a significant marker for European politics.",
    region: "Europe",
  },
  {
    id: "fiala",
    name: "Petr Fiala",
    country: "Czech Republic",
    countryCode: "CZ",
    flag: "🇨🇿",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Petr_Fiala_2021_%28cropped%29.jpg/440px-Petr_Fiala_2021_%28cropped%29.jpg",
    age: 60,
    birthYear: 1964,
    birthPlace: "Brno, Czechoslovakia (now Czech Republic)",
    education: [
      {
        institution: "Masaryk University",
        degree: "B.A. Czech Language & Literature",
        year: 1987,
      },
      {
        institution: "Masaryk University",
        degree: "Ph.D. Political Science",
        year: 1995,
      },
    ],
    party: "Civic Democratic Party (ODS)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Political science professor who led the SPOLU coalition to defeat Babiš in the 2021 elections, ending the era of Czech oligarch politics. Pro-NATO hawk and one of Eastern Europe&#39;s most committed Ukraine supporters. Re-elected in 2025 elections.",
    significantEvents: [
      {
        year: 2021,
        event: "Led SPOLU coalition to defeat Babiš — major democratic shift",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Chaired EU Council presidency during Ukraine war&#39;s first year",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Organised 800,000-shell artillery initiative for Ukraine",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Won re-election; Czech Republic deepens NATO eastern flank role",
        impact: "positive",
      },
    ],
    achievements: [
      "Organised Europe&#39;s largest non-US artillery package for Ukraine (800K shells)",
      "Czech EU Council presidency — managed Ukraine war entry into EU frameworks",
      "Defeated Babiš — restored institutional independence",
      "Czech Republic hosts major NATO exercises as eastern flank state",
    ],
    politicalViews:
      "Conservative, strong NATO commitment, hawkish Russia policy, pro-EU member state rights (Czech sovereignty). Economic liberalism, anti-corruption, rule of law. Among Eastern Europe&#39;s most pro-Ukraine voices.",
    approvalRating: 39,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "One of Europe&#39;s most consequential small-state leaders on Ukraine — the Czech ammunition initiative filled a critical gap in EU military support. Czech Republic punches above its weight under Fiala&#39;s government.",
    region: "Europe",
  },
  {
    id: "mitsotakis",
    name: "Kyriakos Mitsotakis",
    country: "Greece",
    countryCode: "GR",
    flag: "🇬🇷",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kyriakos_Mitsotakis_2023_%28cropped%29.jpg/440px-Kyriakos_Mitsotakis_2023_%28cropped%29.jpg",
    age: 57,
    birthYear: 1968,
    birthPlace: "Athens, Greece",
    education: [
      {
        institution: "Harvard University",
        degree: "B.A. Social Studies",
        year: 1990,
      },
      {
        institution: "Stanford University",
        degree: "M.Sc. International Political Economy",
        year: 1992,
      },
      { institution: "Harvard Business School", degree: "M.B.A.", year: 1995 },
    ],
    party: "New Democracy",
    ideology: "Conservative",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Son of former PM Konstantinos Mitsotakis and brother of MEP Dora Bakoyannis. Harvard and HBS-educated technocrat who led New Democracy to two consecutive majorities (2019 and 2023) — the first since 2008. Transformed Greece from eurozone crisis basket case to fastest-growing EU economy.",
    significantEvents: [
      {
        year: 2019,
        event: "Won landslide — ended Syriza&#39;s left-wing government",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "Greece&#39;s COVID response rated among Europe&#39;s best initially",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Train crash killed 57 — sparked massive protests over rail safety",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Won second consecutive majority — first repeat majority since 2008",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Greece&#39;s GDP grew fastest of all EU economies in 2023–24",
        impact: "positive",
      },
    ],
    achievements: [
      "Greece&#39;s fastest economic growth in EU — investment grade credit restored",
      "Successful completion of ESM bailout programme",
      "Defence upgrades — Greece bought French Rafale fighters and frigates",
      "Greece positioned as key EU energy hub for LNG post-Russia crisis",
    ],
    politicalViews:
      "Centre-right market liberal. Pro-EU, pro-NATO, strong anti-immigration enforcement — built barriers and adopted pushback policies. Technology and startup ecosystem developer. Manages complex Turkey–Greece tensions tactically.",
    approvalRating: 41,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed Greece from Europe&#39;s most economically embarrassed state to a growth leader. His business-first approach and Harvard credentials give him unusual credibility with European and US investors. Greece&#39;s geopolitical importance in Eastern Med is growing.",
    region: "Europe",
  },
  {
    id: "schoof",
    name: "Dick Schoof",
    country: "Netherlands",
    countryCode: "NL",
    flag: "🇳🇱",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Dick_Schoof_2024_official_portrait.jpg/440px-Dick_Schoof_2024_official_portrait.jpg",
    age: 67,
    birthYear: 1957,
    birthPlace: "Wieringermeer, North Holland, Netherlands",
    education: [
      { institution: "Leiden University", degree: "B.A. Law", year: 1981 },
    ],
    party: "Independent (non-partisan technocrat)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Former Director-General of the Dutch Intelligence Service (AIVD) and National Coordinator for Security and Counterterrorism, appointed as PM by Geert Wilders&#39; coalition in July 2024. Not a politician himself — a civil servant and intelligence chief tapped to lead the most right-wing Dutch government in modern history after Wilders&#39; historic election victory.",
    significantEvents: [
      {
        year: 2023,
        event: "Geert Wilders wins Dutch election with PVV — largest party",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Appointed PM as non-partisan technocrat to reassure EU and NATO allies",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Amsterdam soccer anti-Semitic violence incident — diplomatic crisis with Israel",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Netherlands navigates Trump tariffs as EU&#39;s most trade-exposed economy",
        impact: "negative",
      },
    ],
    achievements: [
      "Led AIVD (Dutch intelligence) during Russia&#39;s most aggressive espionage era",
      "MH17 investigation in AIVD oversight era",
      "Stabilised coalition governance for a historically difficult right-wing alliance",
      "Maintained Netherlands&#39; NATO and EU commitments despite far-right coalition partners",
    ],
    politicalViews:
      "Career civil servant — non-partisan. Governs with PVV (Wilders), VVD, NSC and BBB coalition. Policies: strict immigration, farmers&#39; rights, EU scepticism on regulation but pro-NATO. Personally moderate conservative.",
    approvalRating: 33,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "A technocratic fig-leaf for Europe&#39;s most prominent far-right governing coalition. His intelligence background makes him a credible NATO partner, but Wilders&#39; influence shapes his political constraints fundamentally.",
    region: "Europe",
  },
  // ── BATCH 15: SE Europe, Baltics, Alpine, Micro-states ────────────────────
  {
    id: "zhelyazkov",
    name: "Rosen Zhelyazkov",
    country: "Bulgaria",
    countryCode: "BG",
    flag: "🇧🇬",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Rosen_Zhelyazkov_2024_official_portrait.jpg/440px-Rosen_Zhelyazkov_2024_official_portrait.jpg",
    age: 50,
    birthYear: 1974,
    birthPlace: "Sofia, Bulgaria",
    education: [
      {
        institution: "Technical University of Sofia",
        degree: "B.Eng. Electronics",
        year: 1997,
      },
      {
        institution: "Sofia University",
        degree: "M.A. Public Administration",
        year: 2005,
      },
    ],
    party: "GERB (Citizens for European Development of Bulgaria)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Speaker of Bulgaria&#39;s National Assembly who became Prime Minister in January 2024 after yet another round of protracted coalition negotiations — Bulgaria held 6 elections in 3 years. Led by Boyko Borisov&#39;s GERB party, Zhelyazkov heads a coalition that ended the political paralysis.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Bulgaria undergoes repeated election cycle — 5 votes in two years",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Denkov&#39;s reformist government collapsed after 6 months",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Zhelyazkov forms stable GERB-led coalition; ends election cycle",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Bulgaria on track for Eurozone accession — schengen land borders opened",
        impact: "positive",
      },
    ],
    achievements: [
      "Ended Bulgaria&#39;s three-year political deadlock",
      "Schengen land border access achieved after years of delay",
      "Eurozone accession roadmap advanced",
      "Anti-corruption measures and judicial reform continued",
    ],
    politicalViews:
      "Centre-right, pro-EU, pro-NATO. GERB&#39;s pragmatic conservatism — business-friendly, tough on corruption. Supports Bulgaria&#39;s full EU integration including Schengen and Eurozone. Atlanticist security posture.",
    approvalRating: 31,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Brings much-needed stability to one of the EU&#39;s most politically fractured member states. Bulgaria&#39;s Eurozone and full Schengen integration under his watch would complete the country&#39;s post-communist European transformation.",
    region: "Europe",
  },
  {
    id: "vucic",
    name: "Aleksandar Vučić",
    country: "Serbia",
    countryCode: "RS",
    flag: "🇷🇸",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Aleksandar_Vu%C4%8Di%C4%87_2019.jpg/440px-Aleksandar_Vu%C4%8Di%C4%87_2019.jpg",
    age: 55,
    birthYear: 1970,
    birthPlace: "Belgrade, Serbia",
    education: [
      { institution: "University of Belgrade", degree: "B.A. Law", year: 1995 },
    ],
    party: "Serbian Progressive Party (SNS)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2017, to: "present" }],
    background:
      "Former information minister under Milošević who reinvented himself as a pro-EU conservative. Dominates Serbian politics — previously as PM, now as President. Plays the delicate game of pursuing EU membership while refusing to sanction Russia and maintaining Serbia&#39;s refusal to recognise Kosovo&#39;s independence.",
    significantEvents: [
      {
        year: 2017,
        event:
          "Became President after dominating Serbian politics as PM since 2014",
        impact: "neutral",
      },
      {
        year: 2022,
        event:
          "Serbia refuses to sanction Russia despite EU candidacy pressure",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Kosovo tensions — NATO KFOR increased; brokered by US and EU",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Lithium &#39;Jadar&#39; project deal with EU and UK — Serbia as critical minerals hub",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Mass anti-government protests after Novi Sad station collapse killed 16",
        impact: "negative",
      },
    ],
    achievements: [
      "Serbia&#39;s GDP grew to highest level in modern history",
      "Jadar lithium project deal — Serbia becomes EU&#39;s critical minerals partner",
      "Belgrade&#39;s major infrastructure investment boom",
      "Maintained Serbia&#39;s EU candidacy despite Russia refusal",
    ],
    politicalViews:
      "Serbian nationalist, officially pro-EU but refuses anti-Russia consensus. &#39;Four pillars&#39; foreign policy — EU, Russia, China, US simultaneously. Kosovo non-recognition is red line. Controls vast media ownership domestically.",
    approvalRating: 42,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "The Balkans&#39; most consequential leader — Serbia&#39;s EU path, Kosovo&#39;s status, and Russian influence in SE Europe all run through him. His lithium deal with the EU marks a strategic pivot that Beijing and Moscow have noted with concern.",
    region: "Europe",
  },
  {
    id: "rama",
    name: "Edi Rama",
    country: "Albania",
    countryCode: "AL",
    flag: "🇦🇱",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Edi_Rama_2019_%28cropped%29.jpg/440px-Edi_Rama_2019_%28cropped%29.jpg",
    age: 60,
    birthYear: 1964,
    birthPlace: "Tirana, Albania",
    education: [
      {
        institution: "Academy of Arts, Tirana",
        degree: "B.F.A. Painting",
        year: 1990,
      },
    ],
    party: "Socialist Party of Albania",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2013, to: "present" }],
    background:
      "Artist and former Mayor of Tirana who painted the city&#39;s grey communist-era buildings in bright colours as a metaphor for transformation. Has been PM for over a decade — the longest-serving current Albanian PM. Albania opened EU accession negotiations in 2022 under his leadership.",
    significantEvents: [
      {
        year: 2013,
        event: "Won election; became PM on art and anti-corruption platform",
        impact: "positive",
      },
      {
        year: 2019,
        event: "Albania devastated by 6.4 magnitude earthquake — 51 killed",
        impact: "negative",
      },
      {
        year: 2022,
        event: "EU accession negotiations officially opened",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Italy-Albania migration deal — offshore asylum processing agreed",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Won fourth consecutive election — cementing dominant position",
        impact: "positive",
      },
    ],
    achievements: [
      "Albania opened EU accession negotiations after years of waiting",
      "Italy-Albania migration deal — first offshore EU processing agreement",
      "Tirana transformed from post-communist grey city to vibrant capital",
      "Four consecutive election victories — remarkable political dominance",
    ],
    politicalViews:
      "Social democratic, pro-EU integration as top priority, pro-NATO. Anti-corruption (with critics noting its limits), modernisation-first. Warm relationship with Italy and US. Balkans regional cooperation advocate.",
    approvalRating: 46,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed Albania from a post-Hoxha recluse to an EU candidate with global diplomatic punch above its weight via the Italy migration deal. His artistic sensibility and political durability make him one of the Balkans&#39; most distinctive leaders.",
    region: "Europe",
  },
  {
    id: "keller-sutter",
    name: "Karin Keller-Sutter",
    country: "Switzerland",
    countryCode: "CH",
    flag: "🇨🇭",
    title: "Federal Councillor & Finance Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Karin_Keller-Sutter_%282024%29.jpg/440px-Karin_Keller-Sutter_%282024%29.jpg",
    age: 61,
    birthYear: 1963,
    birthPlace: "Wil, St. Gallen, Switzerland",
    education: [
      {
        institution: "University of Geneva",
        degree: "Advanced Interpreter Studies",
        year: 1988,
      },
      {
        institution: "University of St. Gallen",
        degree: "M.A. Public Administration",
        year: 2000,
      },
    ],
    party: "The Centre / FDP (The Liberals)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Interpreter-turned-politician who rose through cantonal politics in St. Gallen before joining the Federal Council. Served as Justice and Police head (2019–2023) before taking Finance. As 2024 Federal President, handled Switzerland&#39;s central bank diplomacy and EU bilateral framework negotiations.",
    significantEvents: [
      {
        year: 2023,
        event:
          "Orchestrated UBS takeover of Credit Suisse — prevented systemic banking collapse",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Became Federal Councillor for Finance after Justice portfolio",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Served as Federal President — chaired seven-member Federal Council",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Bilateral III negotiations with EU — new Swiss-EU framework agreement",
        impact: "neutral",
      },
    ],
    achievements: [
      "Managed Credit Suisse collapse — orchestrated UBS takeover in one weekend",
      "Prevented Swiss banking system crisis from becoming global contagion",
      "Swiss Federal President 2024",
      "EU-Switzerland bilateral negotiations advanced after years of deadlock",
    ],
    politicalViews:
      "Liberal conservative — fiscal discipline, Swiss neutrality, direct democracy respect. Pro-EU relationship through bilateral agreements (not membership). Financial regulation after Credit Suisse lesson. Rule of law champion.",
    approvalRating: 62,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Her handling of Credit Suisse — the most consequential Swiss banking crisis in history — defined her tenure. The weekend she orchestrated UBS&#39;s acquisition may have prevented the largest European bank failure since 2008.",
    region: "Europe",
  },
  {
    id: "abela",
    name: "Robert Abela",
    country: "Malta",
    countryCode: "MT",
    flag: "🇲🇹",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Robert_Abela_2022_%28cropped%29.jpg/440px-Robert_Abela_2022_%28cropped%29.jpg",
    age: 47,
    birthYear: 1977,
    birthPlace: "Ta&#39; Xbiex, Malta",
    education: [
      { institution: "University of Malta", degree: "B.A. Law", year: 2001 },
      {
        institution: "University of Malta",
        degree: "Doctorate in Law",
        year: 2007,
      },
    ],
    party: "Labour Party (MLP)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Lawyer who became PM at 42 after Joseph Muscat resigned over the Daphne Caruana Galizia murder scandal. Won the 2022 election with a record 55% majority — the largest in Maltese history. Malta&#39;s unique position as a small EU island state gives it outsized influence on migration and Mediterranean policy.",
    significantEvents: [
      {
        year: 2020,
        event: "Became PM after Muscat scandal resignation",
        impact: "neutral",
      },
      {
        year: 2022,
        event: "Won election with record 55% majority",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Malta removed from FATF grey list — financial monitoring cleared",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Mediterranean migration crisis — Malta as frontline rescue state",
        impact: "negative",
      },
    ],
    achievements: [
      "Won Malta&#39;s largest-ever election majority (55%)",
      "Removed Malta from FATF financial crime grey list",
      "Malta&#39;s GDP among EU&#39;s fastest growing — gaming and fintech hub",
      "Maintained Malta&#39;s neutrality and non-aligned defence policy",
    ],
    politicalViews:
      "Centre-left social democratic, pro-EU, non-aligned defence (no NATO membership). Business-friendly — gaming, financial services, aviation leasing. Mediterranean migration management. Progressive social agenda — same-sex marriage, cannabis decriminalisation.",
    approvalRating: 48,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Leads EU&#39;s smallest member state by population with outsized influence on migration policy and Mediterranean diplomacy. Malta&#39;s non-NATO status gives it a unique mediating role in the EU&#39;s security debates.",
    region: "Europe",
  },
  {
    id: "frieden",
    name: "Luc Frieden",
    country: "Luxembourg",
    countryCode: "LU",
    flag: "🇱🇺",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Luc_Frieden_2024_official_portrait.jpg/440px-Luc_Frieden_2024_official_portrait.jpg",
    age: 59,
    birthYear: 1965,
    birthPlace: "Luxembourg City, Luxembourg",
    education: [
      {
        institution: "University of Cambridge",
        degree: "B.A. Law",
        year: 1988,
      },
      { institution: "Harvard Law School", degree: "LL.M.", year: 1989 },
      { institution: "University of Paris I", degree: "Ph.D. Law", year: 1993 },
    ],
    party: "Christian Social People&#39;s Party (CSV)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Harvard and Cambridge-educated lawyer who returned to politics after a career in banking at BGL BNP Paribas. Became PM after CSV won the October 2023 elections, ending the liberal DP-LSAP coalition. Luxembourg is the EU&#39;s wealthiest country per capita and home to major EU institutions.",
    significantEvents: [
      {
        year: 2023,
        event: "CSV wins election — Frieden becomes PM after banking career",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Luxembourg&#39;s space mining legislation — first EU country to regulate space resources",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "EU Court of Justice and other institutions hosted in Luxembourg — deepened institutional role",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Luxembourg financial sector navigates new EU AML regulations",
        impact: "neutral",
      },
    ],
    achievements: [
      "Luxembourg&#39;s EU institutional hosting expanded",
      "Space resources legal framework — global regulatory pioneer",
      "Financial centre maintained top European status post-Brexit",
      "Investment fund industry regulation balanced with growth",
    ],
    politicalViews:
      "Christian democratic conservative, pro-EU integration, pro-Atlantic alliance. Financial centre pragmatism — opposes excessive EU financial regulation. Multilingual governance (French, German, Luxembourgish). Fiscally conservative with social investment.",
    approvalRating: 51,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Leads the EU&#39;s wealthiest state and one of its most important financial and institutional hubs. Luxembourg&#39;s space mining legislation positions it as a global regulatory pioneer for the next frontier of resource law.",
    region: "Europe",
  },
  {
    id: "nauseda",
    name: "Gitanas Nausėda",
    country: "Lithuania",
    countryCode: "LT",
    flag: "🇱🇹",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Gitanas_Naus%C4%97da_official_portrait_2019.jpg/440px-Gitanas_Naus%C4%97da_official_portrait_2019.jpg",
    age: 61,
    birthYear: 1964,
    birthPlace: "Kaunas, Soviet-occupied Lithuania",
    education: [
      {
        institution: "Vilnius University",
        degree: "B.A. Economics",
        year: 1987,
      },
      {
        institution: "Vilnius University",
        degree: "Ph.D. Economics",
        year: 1993,
      },
    ],
    party: "Independent",
    ideology: "Conservative",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Former chief economist of SEB Bank Lithuania who won the 2019 presidential election as an independent with little political experience. Re-elected in 2024. Lithuania is one of the most hawkish NATO members toward Russia — sharing a direct border making national security the dominant issue.",
    significantEvents: [
      {
        year: 2019,
        event: "Won presidential election as political outsider economist",
        impact: "positive",
      },
      {
        year: 2021,
        event:
          "Lithuania challenged China over Taiwan — Beijing imposed trade embargo",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Lithuania blocked Russia&#39;s Kaliningrad transit — major NATO tensions",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Re-elected; Lithuania&#39;s defence spending raised to 3% of GDP",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Baltic Defence Line — joint fortifications with Latvia and Estonia",
        impact: "positive",
      },
    ],
    achievements: [
      "Lithuania raised defence spending to 3%+ of GDP — NATO&#39;s top tier",
      "Taiwan de facto diplomatic ties strengthened despite Chinese pressure",
      "Baltic Defence Line fortifications initiated",
      "NATO&#39;s permanent battalion in Lithuania secured",
    ],
    politicalViews:
      "Conservative, Atlanticist, hawkish Russia security stance, pro-Taiwan. Believes Baltic states must prepare for Russian aggression. Strong democratic values — experienced Soviet occupation personally as a child. Champions Eastern European voice in NATO.",
    approvalRating: 56,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Lithuania under Nausėda punches far above its weight on China-Taiwan policy and Russia-NATO deterrence. The Kaliningrad transit decision was the most dramatic single NATO member action against Russia outside direct military confrontation.",
    region: "Europe",
  },
  // ── BATCH 16: Baltics continuation + Western Balkans ─────────────────────
  {
    id: "silina",
    name: "Evika Siliņa",
    country: "Latvia",
    countryCode: "LV",
    flag: "🇱🇻",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Evika_Sili%C5%86a_2023_official_portrait.jpg/440px-Evika_Sili%C5%86a_2023_official_portrait.jpg",
    age: 47,
    birthYear: 1976,
    birthPlace: "Rīga, Soviet-occupied Latvia",
    education: [
      {
        institution: "University of Latvia",
        degree: "B.A. Law",
        year: 2000,
      },
      {
        institution: "Riga Graduate School of Law",
        degree: "M.A. European Law",
        year: 2004,
      },
    ],
    party: "New Unity (Jaunā Vienotība)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Latvia&#39;s first female Prime Minister, appointed in September 2023 after Krišjānis Kariņš resigned. Former State Chancellery official and MP for New Unity. Latvia shares a long border with Russia and Belarus, making it one of NATO&#39;s most security-conscious members on the eastern flank.",
    significantEvents: [
      {
        year: 2023,
        event: "Became Latvia&#39;s first female PM after Kariņš resignation",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Latvia raised defence budget to 3% of GDP — among NATO&#39;s highest",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Baltic states synchronised electricity grid desynchronisation from Russia",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Baltic Defence Line — joint fortification project with Estonia and Lithuania",
        impact: "positive",
      },
    ],
    achievements: [
      "Led Latvia&#39;s desynchronisation from Russian BRELL power grid",
      "Raised defence spending to NATO&#39;s top tier — 3%+ of GDP",
      "Baltic Defence Line infrastructure initiated",
      "Latvia&#39;s first female Prime Minister",
    ],
    politicalViews:
      "Conservative Atlanticist, hawkish Russia security stance, pro-EU. Defence investment and NATO eastern flank reinforcement as absolute priorities. Strong Ukraine support. Pro-Baltic solidarity with Estonia and Lithuania.",
    approvalRating: 38,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Leads Latvia through the most consequential security transition since independence — cutting electricity dependency on Russia while building NATO&#39;s eastern fortifications. Latvia&#39;s 27% Russian-speaking minority adds domestic security complexity.",
    region: "Europe",
  },
  {
    id: "karis",
    name: "Alar Karis",
    country: "Estonia",
    countryCode: "EE",
    flag: "🇪🇪",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Alar_Karis_2021_official_portrait.jpg/440px-Alar_Karis_2021_official_portrait.jpg",
    age: 65,
    birthYear: 1958,
    birthPlace: "Tartu, Soviet-occupied Estonia",
    education: [
      {
        institution: "Estonian University of Life Sciences",
        degree: "M.Sc. Animal Genetics",
        year: 1983,
      },
      {
        institution: "University of Helsinki",
        degree: "Ph.D. Genetics",
        year: 1995,
      },
    ],
    party: "Independent (non-partisan)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Geneticist and former head of the National Audit Office who became Estonia&#39;s President in 2021. A constitutional figurehead, but Estonia&#39;s presidency carries significant moral authority on democracy and Russia policy. His childhood under Soviet occupation informs his hawkish positions on Russia.",
    significantEvents: [
      {
        year: 2021,
        event: "Elected President by parliament — scientist in top state role",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Estonia sent highest per-capita military aid of any NATO member to Ukraine",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Called Russia&#39;s actions genocide — among first leaders to do so",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Championed full EU sanctions enforcement and Ukraine NATO path",
        impact: "positive",
      },
    ],
    achievements: [
      "Estonia&#39;s highest per-capita military aid contribution to Ukraine",
      "World&#39;s most digital government maintained under his presidency",
      "Estonia&#39;s NATO eastern flank role elevated",
      "Baltic solidarity framework reinforced with Latvia and Lithuania",
    ],
    politicalViews:
      "Conservative, non-partisan. Hawkish Russia policy — views appeasement as existential threat. Strong transatlantic alliance, pro-EU integration, digital governance pioneer. Personal Soviet experience shapes his worldview.",
    approvalRating: 64,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Estonia under Karis has become the EU&#39;s most per-capita committed Ukraine supporter and the global showcase for what a digital-first governance model can achieve. His moral authority on Russian aggression shapes Baltic diplomatic discourse.",
    region: "Europe",
  },
  {
    id: "golob",
    name: "Robert Golob",
    country: "Slovenia",
    countryCode: "SI",
    flag: "🇸🇮",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Robert_Golob_2022_official_portrait.jpg/440px-Robert_Golob_2022_official_portrait.jpg",
    age: 58,
    birthYear: 1967,
    birthPlace: "Nova Gorica, Yugoslavia (now Slovenia)",
    education: [
      {
        institution: "University of Ljubljana",
        degree: "B.Eng. Electrical Engineering",
        year: 1991,
      },
      {
        institution: "Imperial College London",
        degree: "M.Sc. Energy Systems",
        year: 1995,
      },
      {
        institution: "University of Ljubljana",
        degree: "Ph.D. Electrical Engineering",
        year: 2001,
      },
    ],
    party: "Freedom Movement (Gibanje Svoboda)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Former CEO of renewable energy company GEN-I who entered politics in 2022, founding the Freedom Movement six weeks before the election and winning a landslide victory against incumbent PM Janez Janša — the Slovenian ally of Orbán. Ended Slovenia&#39;s drift toward illiberal Eurosceptic governance.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Founded Freedom Movement; won election in six weeks — beat Janša",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Restored Slovenia&#39;s public media independence after Janša&#39;s controls",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Severe flooding — worst natural disaster in Slovenian history",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Slovenia recognised Palestinian state — one of first EU members",
        impact: "neutral",
      },
    ],
    achievements: [
      "Ended Janša&#39;s Orbán-aligned governance — restored EU institutional norms",
      "Slovenia&#39;s renewable energy transition accelerated",
      "Eurovision 2023 — Slovenia hosted international broadcasting moment",
      "EU flood recovery funds secured after historic 2023 floods",
    ],
    politicalViews:
      "Liberal progressive, pro-EU, pro-rule of law, renewable energy champion. Supports Palestinian statehood. Opposes Orbán-style illiberalism. Climate policy, digital economy, EU integration as core agenda.",
    approvalRating: 36,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Pulled Slovenia back from the brink of Orbán-style institutional erosion. His energy expertise gives him credibility in EU climate debates. Governing an increasingly difficult economic environment with declining support.",
    region: "Europe",
  },
  {
    id: "becirovic",
    name: "Denis Bećirović",
    country: "Bosnia & Herzegovina",
    countryCode: "BA",
    flag: "🇧🇦",
    title: "Chairman, Presidency of Bosnia and Herzegovina",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Denis_Be%C4%87irovi%C4%87_2022_%28cropped%29.jpg/440px-Denis_Be%C4%87irovi%C4%87_2022_%28cropped%29.jpg",
    age: 52,
    birthYear: 1972,
    birthPlace: "Srebrenica, Yugoslavia (now Bosnia and Herzegovina)",
    education: [
      {
        institution: "University of Sarajevo",
        degree: "B.A. History",
        year: 1996,
      },
      {
        institution: "University of Sarajevo",
        degree: "M.A. History",
        year: 2000,
      },
      {
        institution: "University of Sarajevo",
        degree: "Ph.D. History",
        year: 2005,
      },
    ],
    party: "Social Democratic Party of BiH (SDP)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Born in Srebrenica — site of the worst genocide in Europe since WWII — Bećirović is a Bosniak member of Bosnia&#39;s three-person rotating presidency. Historian by training, his life story embodies the tragedy and resilience of post-war Bosnia. Won the 2022 Bosniak member election against the SDA incumbent.",
    significantEvents: [
      {
        year: 1995,
        event: "Srebrenica genocide — hometown devastated during Balkan wars",
        impact: "negative",
      },
      {
        year: 2022,
        event: "Won Bosniak seat on Presidency — reform mandate over SDA",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Bosnia officially received EU candidate status",
        impact: "positive",
      },
      {
        year: 2024,
        event: "EU accession negotiations opened — historic for BiH",
        impact: "positive",
      },
    ],
    achievements: [
      "EU candidacy and negotiations opened during his presidency term",
      "Bosnia&#39;s first steps toward NATO Membership Action Plan",
      "Srebrenica genocide commemoration elevated internationally",
      "Reform agenda against ethnic nationalist parties advanced",
    ],
    politicalViews:
      "Social democratic, multi-ethnic Bosnia advocacy, EU and NATO integration as existential anchor. Anti-nationalist, anti-corruption. Believes EU membership is the only path to durable Bosnian stability.",
    approvalRating: 44,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Bosnia&#39;s EU candidacy under his term is the most hopeful diplomatic development in the country&#39;s post-war history. His Srebrenica origins give him moral authority in the ongoing contest over historical memory and ethnic nationalism in the Balkans.",
    region: "Europe",
  },
  {
    id: "spajic",
    name: "Milojko Spajić",
    country: "Montenegro",
    countryCode: "ME",
    flag: "🇲🇪",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Milojko_Spaji%C4%87_2024_official_portrait.jpg/440px-Milojko_Spaji%C4%87_2024_official_portrait.jpg",
    age: 37,
    birthYear: 1987,
    birthPlace: "Podgorica, Yugoslavia (now Montenegro)",
    education: [
      {
        institution: "University of Montenegro",
        degree: "B.Sc. Economics",
        year: 2010,
      },
      {
        institution: "Harvard University",
        degree: "M.A. Public Administration",
        year: 2015,
      },
    ],
    party: "Europe Now! (Evropa sad!)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Harvard-educated economist and one of the youngest PMs in Europe. Founded the Europe Now! movement on a technocratic, EU-integration platform. Montenegro has been an EU candidate since 2010 — the longest-standing candidate — and a NATO member since 2017. Spajić&#39;s government aims to close EU accession chapters.",
    significantEvents: [
      {
        year: 2023,
        event: "Won election; became one of Europe&#39;s youngest PMs at 36",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Montenegro accelerated EU accession chapter closures",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Rule of law and judiciary reforms advanced under EU pressure",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Montenegro on track for EU membership by 2028 — optimistic target",
        impact: "positive",
      },
    ],
    achievements: [
      "Most EU accession chapters closed in Montenegro&#39;s history under his government",
      "Judiciary independence reforms advanced",
      "Montenegro&#39;s NATO membership cemented as NATO headquarters presence grows",
      "One of Europe&#39;s youngest heads of government",
    ],
    politicalViews:
      "Pro-European liberal technocrat. EU membership as defining national project. Rule of law, anti-corruption, judicial independence. Pro-NATO. Balances pro-Serbian constituency with EU-Western alignment.",
    approvalRating: 42,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Montenegro&#39;s EU accession under Spajić would be the first Western Balkans EU enlargement since Croatia in 2013 — making it the most consequential potential achievement for the region&#39;s European future if completed on his timeline.",
    region: "Europe",
  },
  {
    id: "mickoski",
    name: "Hristijan Mickoski",
    country: "North Macedonia",
    countryCode: "MK",
    flag: "🇲🇰",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Hristijan_Mickoski_2024_official_portrait.jpg/440px-Hristijan_Mickoski_2024_official_portrait.jpg",
    age: 45,
    birthYear: 1979,
    birthPlace: "Bitola, Yugoslavia (now North Macedonia)",
    education: [
      {
        institution: "Ss. Cyril and Methodius University",
        degree: "B.Eng. Electrical Engineering",
        year: 2002,
      },
      {
        institution: "Ss. Cyril and Methodius University",
        degree: "M.Sc. Engineering",
        year: 2006,
      },
    ],
    party: "VMRO-DPMNE",
    ideology: "Conservative",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Leader of the conservative VMRO-DPMNE who won the May 2024 elections, ending the SDSM-led governments that navigated North Macedonia&#39;s EU and NATO accession path including the painful Prespa Agreement renaming the country from Macedonia to North Macedonia. Mickoski is sceptical of the Prespa Agreement&#39;s concessions to Greece.",
    significantEvents: [
      {
        year: 2019,
        event: "Prespa Agreement renamed country — ended Greek NATO veto",
        impact: "positive",
      },
      {
        year: 2020,
        event: "North Macedonia joined NATO — historic security achievement",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Won election — VMRO-DPMNE returns after years in opposition",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Bulgaria veto on EU accession language demands — ongoing crisis",
        impact: "negative",
      },
    ],
    achievements: [
      "North Macedonia&#39;s NATO membership maintained and deepened",
      "Won election returning VMRO-DPMNE to power",
      "Economic ties with EU partners maintained",
      "Manages Bulgaria&#39;s EU accession veto through diplomatic channels",
    ],
    politicalViews:
      "Conservative nationalist, more sceptical of Prespa Agreement concessions. Pro-NATO but slower on EU reforms. Traditional values, Macedonian national identity protection. Critical of previous government&#39;s identity concessions to neighbours.",
    approvalRating: 40,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs a small Balkan state at the intersection of multiple great power tensions — Bulgaria&#39;s EU veto, Greek identity politics, Serbia&#39;s influence, and NATO obligations. North Macedonia&#39;s EU path depends on resolving a dispute about medieval history.",
    region: "Europe",
  },
  {
    id: "kurti",
    name: "Albin Kurti",
    country: "Kosovo",
    countryCode: "XK",
    flag: "🇽🇰",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Albin_Kurti_2021_official_portrait.jpg/440px-Albin_Kurti_2021_official_portrait.jpg",
    age: 49,
    birthYear: 1975,
    birthPlace: "Pristina, Yugoslavia (now Kosovo)",
    education: [
      {
        institution: "University of Pristina",
        degree: "B.Sc. Electrical Engineering",
        year: 1997,
      },
    ],
    party: "Vetevendosje! (Self-Determination Movement)",
    ideology: "Progressive",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Former political prisoner who spent years jailed by Milošević&#39;s Serbia for his activism. Founded the Vetevendosje movement as a non-violent resistance organisation. Won Kosovo&#39;s 2021 elections with a historic 59% majority. Governs one of Europe&#39;s youngest states — Kosovo declared independence from Serbia in 2008, recognised by over 100 countries but not by Russia, China, Serbia, or 5 EU members.",
    significantEvents: [
      {
        year: 2000,
        event: "Released from Serbian prison after international pressure",
        impact: "positive",
      },
      {
        year: 2021,
        event: "Won 59% majority — Kosovo&#39;s largest in democratic history",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Kosovo applied for EU membership and Council of Europe",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Kosovo joined Council of Europe — major recognition milestone",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Serbia-Kosovo normalisation talks stalled; tension in north Kosovo",
        impact: "negative",
      },
    ],
    achievements: [
      "Kosovo joined Council of Europe — the broadest European recognition yet",
      "Kosovo&#39;s largest-ever democratic mandate (59%)",
      "EU visa liberalisation for Kosovo citizens achieved",
      "Anti-corruption prosecutions of wartime KLA figures pursued",
    ],
    politicalViews:
      "Left-wing Albanian nationalist, anti-corruption, pro-EU integration. Seeks full UN membership and Serbia recognition of Kosovo. Refuses to create Association of Serb-majority Municipalities without reciprocal Serbian recognition. Anti-organised crime — including war crime accountability.",
    approvalRating: 48,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs Europe&#39;s youngest democracy — a state still fighting for full international recognition while navigating the world&#39;s most intractable post-war sovereignty dispute. His anti-corruption mandate is at odds with Kosovo&#39;s wartime political establishment, making every day in office a high-stakes confrontation.",
    region: "Europe",
  },
  // ── BATCH 16: Moldova, Zambia, Ecuador extra, Tanzania, UAE PM, Kosovo President, Georgia ──
  {
    id: "sandu",
    name: "Maia Sandu",
    country: "Moldova",
    countryCode: "MD",
    flag: "🇲🇩",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Maia_Sandu_2021_official_portrait.jpg/440px-Maia_Sandu_2021_official_portrait.jpg",
    age: 52,
    birthYear: 1972,
    birthPlace: "Risipeni, Fălești District, Moldavian SSR (now Moldova)",
    education: [
      {
        institution: "Academy of Economic Studies of Moldova",
        degree: "B.A. Economics",
        year: 1994,
      },
      {
        institution: "Harvard Kennedy School",
        degree: "M.P.A. (Masters in Public Administration)",
        year: 2010,
      },
    ],
    party: "Action and Solidarity Party (PAS)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Harvard-educated economist and former World Bank official who became President of Moldova — one of Europe&#39;s poorest countries — in December 2020. Leads the most pro-European administration in Moldovan history. Survived multiple attempted coups and Russian interference campaigns. Won re-election in 2024 alongside a referendum that enshrined EU membership as a constitutional goal.",
    significantEvents: [
      {
        year: 2020,
        event: "Won presidential election defeating Russia-aligned Dodon",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Moldova granted EU candidate status amid Ukraine war spillover",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Russia-linked gas cuts and cyber attacks — Moldova endures energy crisis",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Won re-election; EU membership referendum narrowly passed",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "EU accession negotiations opened — historic milestone for Moldova",
        impact: "positive",
      },
    ],
    achievements: [
      "Moldova granted EU candidate status — fastest path in European history",
      "EU accession negotiations opened within her tenure",
      "Survived sustained Russian hybrid warfare and disinformation campaign",
      "EU membership enshrined in Moldovan constitution via referendum",
    ],
    politicalViews:
      "Liberal pro-European, anti-corruption, rule of law. Committed to EU membership as existential anchor against Russian influence. Balanced on Transnistria frozen conflict. Atlantic alignment via EU partnership.",
    approvalRating: 54,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "The most consequential Moldovan leader since independence — steering a tiny, impoverished country between Russian pressure and European aspiration. Her EU candidacy achievement under active Russian interference is remarkable.",
    region: "Europe",
  },
  {
    id: "hichilema",
    name: "Hakainde Hichilema",
    country: "Zambia",
    countryCode: "ZM",
    flag: "🇿🇲",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Hakainde_Hichilema_2022_official_portrait.jpg/440px-Hakainde_Hichilema_2022_official_portrait.jpg",
    age: 62,
    birthYear: 1962,
    birthPlace: "Bweengwa, Southern Province, Zambia",
    education: [
      {
        institution: "University of Zambia",
        degree: "B.A. Economics",
        year: 1984,
      },
      { institution: "University of Birmingham", degree: "M.B.A.", year: 1987 },
    ],
    party: "United Party for National Development (UPND)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Self-made businessman and cattle farmer who ran for president six times before winning in 2021 — one of Africa&#39;s most persistent democratic comebacks. Was jailed on treason charges widely seen as political persecution by Lungu&#39;s government. Zambia was the first African country to default on its debt during COVID — restructuring it was his defining early challenge.",
    significantEvents: [
      {
        year: 2017,
        event:
          "Jailed on treason charges — widely condemned as political persecution",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Won election on sixth attempt with 57% — decisive democratic mandate",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Zambia completed Africa&#39;s first post-COVID debt restructuring",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Zambia&#39;s copper mining expansion — critical minerals for EV revolution",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Severe drought — energy crisis as Kariba Dam reaches historic low",
        impact: "negative",
      },
    ],
    achievements: [
      "Won presidency on sixth attempt — Africa&#39;s most persistent democratic journey",
      "Completed Zambia&#39;s landmark sovereign debt restructuring",
      "Zambia positioned as key EV copper supplier for global green transition",
      "Anti-corruption prosecutions of previous government officials advanced",
    ],
    politicalViews:
      "Liberal market economics, anti-corruption, pro-Western investment. Positions Zambia as critical minerals partner for the West against China&#39;s dominance. IMF programme compliance. Democratic governance restoration after Lungu-era erosion.",
    approvalRating: 46,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Leads one of Africa&#39;s most mineral-critical nations at the inflection point of the global EV revolution. Zambia&#39;s copper deposits make it a key player in decarbonisation supply chains — if Hichilema can translate natural wealth into development.",
    region: "Africa",
  },
  {
    id: "hassan",
    name: "Samia Suluhu Hassan",
    country: "Tanzania",
    countryCode: "TZ",
    flag: "🇹🇿",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Samia_Suluhu_Hassan_2021_official_portrait.jpg/440px-Samia_Suluhu_Hassan_2021_official_portrait.jpg",
    age: 65,
    birthYear: 1960,
    birthPlace: "Makunduchi, Zanzibar, Tanganyika (now Tanzania)",
    education: [
      {
        institution: "University of Dar es Salaam",
        degree: "B.A. Public Administration",
        year: 1986,
      },
      {
        institution:
          "Institute of Development Studies, University of Manchester",
        degree: "M.Sc. Economic Policy",
        year: 1994,
      },
    ],
    party: "Chama Cha Mapinduzi (CCM)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Africa&#39;s first female president, assuming office in March 2021 after President John Magufuli died of COVID-19 — which he had publicly denied was a real disease. The contrast between Magufuli&#39;s COVID denialism and Hassan&#39;s immediate pivot to vaccination and scientific governance defined her early tenure. First woman to lead Tanzania and East Africa in a major state.",
    significantEvents: [
      {
        year: 2021,
        event:
          "Became Africa&#39;s first female president after Magufuli&#39;s death",
        impact: "positive",
      },
      {
        year: 2021,
        event: "Immediately reversed COVID denialism — vaccinations launched",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Restored diplomatic relations frayed by Magufuli&#39;s isolation",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Tanzania re-engaged with IMF and World Bank after years of withdrawal",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Won 2025 election securing a full term as elected president",
        impact: "positive",
      },
    ],
    achievements: [
      "First female president of Tanzania and East Africa",
      "Reversed COVID denialism — launched mass vaccination programme",
      "Re-engaged Tanzania with international financial institutions",
      "Restored investor confidence after Magufuli&#39;s nationalist isolation",
    ],
    politicalViews:
      "Moderate social democrat within CCM tradition. Pragmatic — balances state ownership with foreign investment attraction. Non-aligned between China (major investor) and West. Pro-East African Community integration. More open than predecessor on civil society.",
    approvalRating: 57,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Her ascension transformed Tanzania from a COVID-denying pariah to a re-engaged African development story. As East Africa&#39;s largest economy by landmass, Tanzania&#39;s direction under Hassan matters enormously for regional stability.",
    region: "Africa",
  },
  {
    id: "zourabichvili",
    name: "Salomé Zourabichvili",
    country: "Georgia",
    countryCode: "GE",
    flag: "🇬🇪",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Salome_Zourabichvili_2018_official_portrait.jpg/440px-Salome_Zourabichvili_2018_official_portrait.jpg",
    age: 72,
    birthYear: 1952,
    birthPlace: "Paris, France (Georgian émigré family)",
    education: [
      {
        institution: "Sciences Po Paris",
        degree: "M.A. Political Science",
        year: 1975,
      },
      {
        institution: "Columbia University",
        degree: "M.A. International Relations",
        year: 1977,
      },
    ],
    party: "Independent (former Georgian Dream, now opposition)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2018, to: "present" }],
    background:
      "French-born Georgian diplomat who served as France&#39;s ambassador to Tbilisi before becoming Georgia&#39;s Foreign Minister and subsequently President. Elected with Georgian Dream backing in 2018 but broke with the ruling party. Fought a dramatic constitutional battle to stay in office after disputed 2024 parliamentary elections spawned massive pro-EU protests.",
    significantEvents: [
      {
        year: 2018,
        event: "Won presidential election with Georgian Dream backing",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Georgia applied for EU membership — approved by Zourabichvili",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Disputed parliamentary elections — massive pro-EU protests erupt",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Refused to leave office after disputed presidential succession",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Pro-EU protest movement — largest in Georgian history continues",
        impact: "neutral",
      },
    ],
    achievements: [
      "Georgia&#39;s EU membership application — first step toward candidacy",
      "Became symbol of pro-EU resistance to Georgian Dream&#39;s Russia drift",
      "Maintained presidential office as democratic anchor during political crisis",
      "International legitimacy secured as Western-recognised voice of Georgian democracy",
    ],
    politicalViews:
      "Pro-European liberal, Atlantic-oriented foreign policy. Georgian sovereignty — against Russian influence and Georgian Dream&#39;s drift toward Moscow. Democratic institution defender. Advocates EU and NATO membership as Georgia&#39;s only security guarantee.",
    approvalRating: 51,
    approvalTrend: "up",
    status: "In Office",
    impact:
      "Became the symbol of Georgia&#39;s democratic choice at a critical crossroads — EU integration versus Russian orbit. Her resistance to Georgian Dream&#39;s contested elections has given the pro-EU protest movement a constitutional anchor figure.",
    region: "Europe",
  },
  {
    id: "rinkevicius",
    name: "Edgars Rinkēvičs",
    country: "Latvia",
    countryCode: "LV",
    flag: "🇱🇻",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Edgars_Rink%C4%93vi%C4%8Ds_2023_official_portrait.jpg/440px-Edgars_Rink%C4%93vi%C4%8Ds_2023_official_portrait.jpg",
    age: 51,
    birthYear: 1973,
    birthPlace: "Rīga, Soviet-occupied Latvia",
    education: [
      { institution: "University of Latvia", degree: "B.A. Law", year: 1996 },
      {
        institution: "George Washington University",
        degree: "M.A. International Affairs",
        year: 2000,
      },
    ],
    party: "New Unity (Jaunā Vienotība)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Latvia&#39;s longest-serving Foreign Minister (2011–2023) who became President in July 2023 — the first openly gay head of state in the post-Soviet space. A fluent English speaker and Atlantic-oriented diplomat who shaped Latvia&#39;s foreign policy through Crimea, MH17, and Ukraine&#39;s full-scale invasion. Among the most knowledgeable European leaders on Russian foreign policy.",
    significantEvents: [
      {
        year: 2014,
        event:
          "Led Latvia&#39;s response to Crimea annexation — championed EU sanctions",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Latvia&#39;s most vocal FM on Ukraine — pushed for maximum sanctions and arms",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Became Latvia&#39;s first openly gay head of state",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Latvia&#39;s electricity desynchronisation from Russia BRELL grid championed",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Baltic Defence Line presidential advocacy across three countries",
        impact: "positive",
      },
    ],
    achievements: [
      "First openly gay head of state in post-Soviet space",
      "12 years as Latvia&#39;s Foreign Minister — record tenure",
      "Latvia&#39;s BRELL electricity desynchronisation from Russia advanced",
      "Baltic Defence Line cooperation framework championed at presidential level",
    ],
    politicalViews:
      "Liberal Atlantic-oriented. Hawkish Russia policy — 12 years reading Kremlin intentions. Pro-NATO, pro-EU, strong Ukraine support. LGBTQ rights advocate within Baltic conservative political culture. Believes Russia is an existential threat requiring permanent deterrence.",
    approvalRating: 59,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "One of Europe&#39;s most Russia-literate leaders — shaped by 12 years watching Kremlin foreign policy. His election as an openly gay president in the post-Soviet space is a significant symbolic milestone for Eastern European democratic norms.",
    region: "Europe",
  },
  {
    id: "chakwera",
    name: "Lazarus Chakwera",
    country: "Malawi",
    countryCode: "MW",
    flag: "🇲🇼",
    title: "President (placeholder — see Lazarus Chakwera)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Lazarus_Chakwera_2021_%28cropped%29.jpg/440px-Lazarus_Chakwera_2021_%28cropped%29.jpg",
    age: 68,
    birthYear: 1955,
    birthPlace: "Lilongwe, Malawi",
    education: [
      {
        institution: "University of Malawi",
        degree: "B.A. Theology",
        year: 1979,
      },
      {
        institution: "Alliance Theological Seminary",
        degree: "M.Div.",
        year: 1984,
      },
      {
        institution: "University of South Africa",
        degree: "Ph.D. Practical Theology",
        year: 2008,
      },
    ],
    party: "Malawi Congress Party (MCP)",
    ideology: "Centrist",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Former pastor and Assemblies of God church president who became Malawi&#39;s President in June 2020 after the Constitutional Court annulled the 2019 election results — in what became Africa&#39;s most celebrated democratic court ruling. Leads one of Africa&#39;s poorest nations but the verdict that brought him to power is celebrated globally as a democratic milestone.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Won re-run election after court annulled 2019 result — historic ruling",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Malawi faces severe flooding and cyclone Freddy devastation",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Cyclone Freddy — worst cyclone in world history by energy; Malawi devastated",
        impact: "negative",
      },
      {
        year: 2024,
        event: "IMF programme continued amid economic difficulties",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Presidential election — faces strong opposition from Chilima&#39;s successor",
        impact: "neutral",
      },
    ],
    achievements: [
      "Beneficiary of Africa&#39;s most celebrated democratic court ruling",
      "Maintained democratic norms and rule of law",
      "International climate finance claims for Cyclone Freddy secured",
      "Malawi&#39;s judicial independence internationally recognised",
    ],
    politicalViews:
      "Christian democratic centrist. Anti-corruption, good governance, rule of law. Pro-Western development partnerships. Climate vulnerable — advocates Loss and Damage compensation for devastating climate events.",
    approvalRating: 35,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "The democratic court ruling that brought him to power is Malawi&#39;s most significant contribution to African democratic jurisprudence. Governing one of the world&#39;s most climate-vulnerable nations during increasingly catastrophic weather events.",
    region: "Africa",
  },
  {
    id: "akufo-addo",
    name: "Nana Akufo-Addo",
    country: "Ghana",
    countryCode: "GH",
    flag: "🇬🇭",
    title: "Former President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Nana_Akufo-Addo_2017.jpg/440px-Nana_Akufo-Addo_2017.jpg",
    age: 80,
    birthYear: 1944,
    birthPlace: "Accra, Gold Coast (now Ghana)",
    education: [
      {
        institution: "University of Ghana, Legon",
        degree: "B.A. Economics",
        year: 1967,
      },
      {
        institution: "Middle Temple, London",
        degree: "Bar at Law (Barrister)",
        year: 1971,
      },
    ],
    party: "New Patriotic Party (NPP)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2017, to: 2025 }],
    background:
      "Human rights lawyer and veteran politician who served two terms as Ghana&#39;s president (2017–2025). His tenure ended with Ghana&#39;s worst economic crisis since independence — the country defaulted on external debt in 2022. But he also championed Africa&#39;s development narrative and launched the &#39;Year of Return&#39; diaspora initiative. Lost the 2024 election to John Mahama.",
    significantEvents: [
      {
        year: 2017,
        event:
          "Won election after three attempts — finally defeated NDC&#39;s Mahama",
        impact: "positive",
      },
      {
        year: 2019,
        event:
          "Year of Return — diaspora tourism initiative for slavery anniversary",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Ghana defaults on external debt — IMF bailout requested",
        impact: "negative",
      },
      {
        year: 2023,
        event: "IMF $3B programme secured — austerity programme begins",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Lost election to Mahama — peaceful democratic handover",
        impact: "neutral",
      },
    ],
    achievements: [
      "Year of Return — one of Africa&#39;s most successful diaspora tourism campaigns",
      "Free Senior High School programme — universal secondary education",
      '"Ghana Beyond Aid" development philosophy championed',
      "Peaceful democratic handover after election loss — democracy maintained",
    ],
    politicalViews:
      "Liberal, pro-West economic development, African self-reliance (&#39;Ghana Beyond Aid&#39;), anti-poverty through education. Mature democratic practitioner. Pan-Africanist with market economics. Vocal on African development financing.",
    approvalRating: 32,
    approvalTrend: "down",
    status: "Former",
    impact:
      "Presided over Ghana&#39;s debt default — the country&#39;s most significant economic failure in decades — but also launched pan-African cultural diplomacy through the Year of Return. Demonstrated democratic maturity in defeat.",
    region: "Africa",
  },
  // ── BATCH 14: Western & Northern Europe ───────────────────────────────────
  // ── BATCH 17: Central Asia, Caucasus, East/West Africa ───────────────────
  {
    id: "tokayev",
    name: "Kassym-Jomart Tokayev",
    country: "Kazakhstan",
    countryCode: "KZ",
    flag: "🇰🇿",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Kassym-Jomart_Tokayev_2022_official_portrait.jpg/440px-Kassym-Jomart_Tokayev_2022_official_portrait.jpg",
    age: 71,
    birthYear: 1953,
    birthPlace: "Almaty, Kazakh SSR (now Kazakhstan)",
    education: [
      {
        institution:
          "Moscow State Institute of International Relations (MGIMO)",
        degree: "B.A. International Relations",
        year: 1975,
      },
      {
        institution: "Diplomatic Academy, Beijing",
        degree: "Advanced Studies",
        year: 1981,
      },
      {
        institution: "Geneva Graduate Institute",
        degree: "Ph.D. Political Science",
        year: 2002,
      },
    ],
    party: "Amanat (formerly Nur Otan)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Career diplomat and former UN Under-Secretary-General who succeeded Nursultan Nazarbayev as Kazakhstan&#39;s president in 2019 — initially seen as a placeholder but has since asserted surprising independence. Crushed an extraordinary January 2022 uprising with Russian CSTO troops, then pivoted away from full Russia alignment after Ukraine invasion.",
    significantEvents: [
      {
        year: 2019,
        event: "Succeeded Nazarbayev — initially seen as loyal successor",
        impact: "neutral",
      },
      {
        year: 2022,
        event:
          "January uprising — invited Russian CSTO troops to suppress it; 238 killed",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Refused to recognise Donetsk and Luhansk — defied Putin publicly",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Constitutional referendum — reduced Nazarbayev family privileges",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Kazakhstan positioned as key Western sanctions-avoidance corridor — resists pressure",
        impact: "neutral",
      },
    ],
    achievements: [
      "Publicly defied Putin on Ukraine — rare for ex-Soviet leader",
      "Constitutional reforms trimming Nazarbayev family power",
      "Kazakhstan became key energy transit hub post-Russia sanctions",
      "Maintained multi-vector foreign policy between Russia, China, and West",
    ],
    politicalViews:
      "Multi-vector pragmatism — cultivates US, EU, China, and Russia ties simultaneously. Modernisation-with-stability model. Limited political pluralism. Seeks Western investment while maintaining CIS ties. Refuses full alignment with Russia&#39;s Ukraine narrative.",
    approvalRating: 58,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Kazakhstan&#39;s surprising pivot away from full Russia alignment after 2022 is one of Central Asia&#39;s most consequential geopolitical shifts. Its vast energy and mineral resources make it indispensable for East-West supply chains.",
    region: "Asia-Pacific",
  },
  {
    id: "aliyev",
    name: "Ilham Aliyev",
    country: "Azerbaijan",
    countryCode: "AZ",
    flag: "🇦🇿",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Ilham_Aliyev_official_portrait_2024.jpg/440px-Ilham_Aliyev_official_portrait_2024.jpg",
    age: 62,
    birthYear: 1961,
    birthPlace: "Baku, Azerbaijan SSR (now Azerbaijan)",
    education: [
      {
        institution:
          "Moscow State Institute of International Relations (MGIMO)",
        degree: "B.A. International Relations",
        year: 1982,
      },
      {
        institution: "MGIMO",
        degree: "Ph.D. History",
        year: 1985,
      },
    ],
    party: "New Azerbaijan Party (YAP)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2003, to: "present" }],
    background:
      "Son of former Soviet official and strongman Heydar Aliyev who inherited power in 2003. Oversaw Azerbaijan&#39;s transformation from a post-Soviet basket case into an energy-exporting state with a professional military that retook Nagorno-Karabakh from Armenia in 44 days in 2020, and again in a 24-hour operation in 2023 — ending a 30-year frozen conflict in modern history&#39;s most rapid territorial recapture.",
    significantEvents: [
      {
        year: 2020,
        event:
          "44-Day War — Azerbaijan retook most of Nagorno-Karabakh from Armenia",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Became critical European energy supplier as Russia gas replaced",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "24-hour military operation ended: all of Karabakh retaken; 100,000+ Armenians fled",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "COP29 hosted in Baku — Azerbaijan as oil state hosting climate summit",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Peace treaty negotiations with Armenia — Zangezur corridor dispute ongoing",
        impact: "neutral",
      },
    ],
    achievements: [
      "Retook Nagorno-Karabakh after 30-year Armenian occupation",
      "Azerbaijan became Europe&#39;s critical alternative gas supplier to Russia",
      "Baku hosted COP29 — global climate diplomacy",
      "Military modernisation transformed Azerbaijan into regional military power",
    ],
    politicalViews:
      "Authoritarian nationalist, Azerbaijan sovereignty absolutist, secular state. Anti-Western on democracy criticism, but pro-Western on energy business. Balances Russia and Turkey (main ally) with European energy partnerships. Opposition suppressed entirely.",
    approvalRating: 78,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Rewrote South Caucasus geopolitics by ending one of the world&#39;s most entrenched frozen conflicts through military force. Azerbaijan&#39;s energy role makes it simultaneously criticised for authoritarianism and courted for gas supply.",
    region: "Asia-Pacific",
  },
  {
    id: "lukashenko",
    name: "Alexander Lukashenko",
    country: "Belarus",
    countryCode: "BY",
    flag: "🇧🇾",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Alexander_Lukashenko_%282022%29.jpg/440px-Alexander_Lukashenko_%282022%29.jpg",
    age: 70,
    birthYear: 1954,
    birthPlace: "Kopys, Vitebsk Oblast, Byelorussian SSR (now Belarus)",
    education: [
      {
        institution: "Mogilev Teaching Institute",
        degree: "B.A. History",
        year: 1975,
      },
      {
        institution: "Belarusian Agricultural Academy",
        degree: "Agriculture & Economics",
        year: 1985,
      },
    ],
    party: "Non-partisan (de facto state authority)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 1994, to: "present" }],
    background:
      "Europe&#39;s longest-serving and last remaining dictator — often called 'Europe&#39;s last dictator&#39; since 1994. Collective farm director turned president who has ruled for over 30 years. Survived the most serious challenge to his power in 2020 when mass protests erupted after a clearly fraudulent election — survived only with Putin&#39;s direct backing.",
    significantEvents: [
      {
        year: 1994,
        event: "Won Belarus&#39;s first and only free presidential election",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "Fraudulent election triggers largest protests in Belarusian history; survived with Russian help",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Forced Ryanair flight to land to arrest journalist Protasevich — unprecedented hijacking",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Hosted Wagner Group after Prigozhin&#39;s mutiny — Prigozhin died in crash weeks later",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Belarus becomes staging ground for Russian missiles targeting Ukraine",
        impact: "negative",
      },
    ],
    achievements: [
      "30+ year regime survival despite Western sanctions and mass protests",
      "Belarus maintained Soviet-era industrial model — some stability delivered",
      "Brokered initial Wagner Group relocation after Prigozhin mutiny",
      "Belarus nuclear weapons — Russia deployed tactical nukes on Belarusian soil",
    ],
    politicalViews:
      "Soviet nostalgia authoritarian. Pro-Russia integration, anti-Western, anti-NATO. State capitalism, collective agriculture preservation. No political opposition tolerated. Deep Belarus-Russia Union State integration as survival mechanism.",
    approvalRating: 27,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "Transformed Belarus into Europe&#39;s most repressive state and Russia&#39;s closest satellite. His post-2020 survival through Russian support makes him the clearest example of Moscow backing authoritarians across the former Soviet space.",
    region: "Europe",
  },
  {
    id: "museveni",
    name: "Yoweri Museveni",
    country: "Uganda",
    countryCode: "UG",
    flag: "🇺🇬",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Yoweri_Museveni_2016_%28cropped%29.jpg/440px-Yoweri_Museveni_2016_%28cropped%29.jpg",
    age: 80,
    birthYear: 1944,
    birthPlace: "Ntungamo, Uganda Protectorate (now Uganda)",
    education: [
      {
        institution: "University of Dar es Salaam",
        degree: "B.A. Political Science & Economics",
        year: 1970,
      },
    ],
    party: "National Resistance Movement (NRM)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 1986, to: "present" }],
    background:
      "Guerrilla leader who seized power in 1986 after a bush war — originally hailed as a new generation of African leader who ended Idi Amin and Obote-era terror. Governed Uganda for nearly 40 years, methodically dismantling term limits and opposition. Signed one of Africa&#39;s harshest anti-homosexuality laws in 2023 despite international condemnation.",
    significantEvents: [
      {
        year: 1986,
        event:
          "NRM seized power after successful bush war — welcomed as liberator",
        impact: "positive",
      },
      {
        year: 2005,
        event: "Removed presidential term limits — enabling indefinite rule",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Won disputed election amid internet blackout; Bobi Wine arrested repeatedly",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Signed Anti-Homosexuality Act — death penalty provisions triggered international sanctions",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Uganda&#39;s oil production begins from Lake Albert fields — transformative revenue",
        impact: "positive",
      },
    ],
    achievements: [
      "Ended Idi Amin and Obote-era mass killings",
      "Uganda&#39;s GDP grew 6%+ annually for two decades",
      "East Africa&#39;s largest military contributor to AMISOM Somalia peacekeeping",
      "Oil production era begins — could transform Uganda&#39;s economy",
    ],
    politicalViews:
      "Pan-African nationalist, development-first authoritarian. Anti-Western criticism of gay rights enforcement. Pro-China investment, pro-East African Community. Economic nationalism in oil sector. Long-term stability through controlled political environment.",
    approvalRating: 45,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "The paradox of Museveni: genuine liberator turned longest-serving East African dictator. His anti-LGBTQ laws triggered World Bank withdrawal of $300M+ in loans. Uganda&#39;s oil era beginning under his watch is his final legacy bid.",
    region: "Africa",
  },
  {
    id: "mahama",
    name: "John Mahama",
    country: "Ghana",
    countryCode: "GH",
    flag: "🇬🇭",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/John_Mahama_2020_%28cropped%29.jpg/440px-John_Mahama_2020_%28cropped%29.jpg",
    age: 66,
    birthYear: 1958,
    birthPlace: "Damongo, Northern Region, Ghana",
    education: [
      {
        institution: "University of Ghana, Legon",
        degree: "B.A. History",
        year: 1981,
      },
      {
        institution: "Institute of Social Studies, The Hague",
        degree: "M.Sc. Communication",
        year: 1993,
      },
    ],
    party: "National Democratic Congress (NDC)",
    ideology: "Social Democrat",
    termsInOffice: [
      { from: 2012, to: 2017 },
      { from: 2025, to: "present" },
    ],
    background:
      "Veteran politician who served as Ghana&#39;s VP and then President (2012–2017) before losing to Akufo-Addo. Won the December 2024 election in a dramatic comeback with 56.5% — defeating the NPP amid Ghana&#39;s worst economic crisis since independence including a 2022 debt default. Represents the second Ghanaian peaceful democratic transfer in three years.",
    significantEvents: [
      {
        year: 2012,
        event:
          "Won disputed presidential election — Supreme Court ruling confirmed victory",
        impact: "positive",
      },
      {
        year: 2016,
        event: "Lost re-election to Akufo-Addo — accepted defeat peacefully",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Won comeback election with 56.5% amid Ghana&#39;s debt crisis",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Inherited IMF programme — managing Ghana&#39;s debt restructuring completion",
        impact: "neutral",
      },
    ],
    achievements: [
      "Won historic comeback election after 8 years in opposition",
      "First GH president formally elected after Supreme Court ruling validated democracy",
      "Infrastructure legacy — roads, dams, hospitals from first term",
      "Peaceful democratic handover models Africa&#39;s democratic standards",
    ],
    politicalViews:
      "Centre-left social democratic, pro-development investment, Greater Accra infrastructure focus. African continental free trade champion. More state-interventionist than Akufo-Addo. Managed Ghana&#39;s relations with China and Western donors pragmatically.",
    approvalRating: 54,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His return caps one of West Africa&#39;s most important democratic consolidation stories — Ghana has now peacefully transferred power four times. Managing the post-default debt restructuring while restoring growth is his defining challenge.",
    region: "Africa",
  },
  {
    id: "tebboune",
    name: "Abdelmadjid Tebboune",
    country: "Algeria",
    countryCode: "DZ",
    flag: "🇩🇿",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Abdelmadjid_Tebboune_2020_official_portrait.jpg/440px-Abdelmadjid_Tebboune_2020_official_portrait.jpg",
    age: 79,
    birthYear: 1945,
    birthPlace: "Mechria, Naama, Algeria",
    education: [
      {
        institution: "National School of Administration (ENA Algeria)",
        degree: "Public Administration",
        year: 1969,
      },
    ],
    party: "National Liberation Front (FLN) — backed",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Career bureaucrat and former PM who was elected in December 2019 — a deeply disputed election that came as the Hirak protest movement demanded system change after Bouteflika&#39;s resignation. Algeria is Africa&#39;s largest country by area and a key European gas supplier, wielding outsized influence in the Sahel and sub-Saharan Africa.",
    significantEvents: [
      {
        year: 2019,
        event:
          "Elected amid Hirak protests demanding system change — 39% turnout",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Algeria became Europe&#39;s second-largest gas supplier as Russia crisis deepened",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Ruptured diplomatic relations with France — recalled ambassador",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Won re-election with 94.6% — deeply uncompetitive vote",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Algeria leads anti-French coalition in Sahel diplomatic realignment",
        impact: "neutral",
      },
    ],
    achievements: [
      "Algeria&#39;s gas exports to Europe tripled during energy crisis",
      "Budget surpluses from energy windfall reinvested in social housing",
      "Military modernisation — Algeria largest African defence spender",
      "African Union mediation role in Sahel conflicts",
    ],
    politicalViews:
      "Algerian nationalist, anti-colonial legacy politics, gas resource sovereigntist. Deeply anti-France (based on colonial history). Non-aligned between Russia and West. Strong state role in economy through Sonatrach oil company. Pan-African solidarity rhetoric.",
    approvalRating: 38,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs Africa&#39;s most militarily powerful and energy-wealthy Maghreb state. Algeria&#39;s gas role in Europe&#39;s post-Russia energy transition gives Tebboune leverage that far exceeds his domestic democratic legitimacy.",
    region: "Africa",
  },
  {
    id: "ouattara",
    name: "Alassane Ouattara",
    country: "Côte d&#39;Ivoire",
    countryCode: "CI",
    flag: "🇨🇮",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Alassane_Ouattara_2012_%28cropped%29.jpg/440px-Alassane_Ouattara_2012_%28cropped%29.jpg",
    age: 83,
    birthYear: 1942,
    birthPlace: "Dimbokro, Côte d&#39;Ivoire",
    education: [
      {
        institution: "University of Pennsylvania",
        degree: "B.A. Economics",
        year: 1965,
      },
      {
        institution: "University of Pennsylvania",
        degree: "Ph.D. Economics",
        year: 1972,
      },
    ],
    party: "Rally of Houphouëtists for Democracy and Peace (RHDP)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2011, to: "present" }],
    background:
      "Former IMF Deputy Managing Director and BCEAO Governor who became Côte d&#39;Ivoire&#39;s president in 2011 after a brutal post-election civil war against incumbent Laurent Gbagbo. Known as &#39;ADO&#39;, he transformed the world&#39;s largest cocoa producer into one of Africa&#39;s fastest-growing economies before a controversial third-term bid in 2020.",
    significantEvents: [
      {
        year: 2011,
        event:
          "Won post-election civil war against Gbagbo — French intervention decisive",
        impact: "positive",
      },
      {
        year: 2015,
        event:
          "Côte d&#39;Ivoire grows at 8–10% annually — fastest in West Africa",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "Contested third-term bid — opposition boycott but stayed in power",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Gbagbo returned and reconciled — historic détente",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Presidential election — Ouattara indicates he may not seek fourth term",
        impact: "neutral",
      },
    ],
    achievements: [
      "Côte d&#39;Ivoire&#39;s economy grew 8–10% annually for a decade",
      "Abidjan transformed into West Africa&#39;s premier business hub",
      "Reconciliation with Gbagbo — ended post-war political divisions",
      "Côte d&#39;Ivoire became West Africa&#39;s largest economy under his watch",
    ],
    politicalViews:
      "IMF/World Bank-trained liberal economist, market-friendly, West-aligned. CFA franc defender — unlike new Sahel leaders. Pro-French security presence (ECOWAS). Anti-coup, pro-democratic institutions. ECOWAS leadership on democratic governance.",
    approvalRating: 47,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed Côte d&#39;Ivoire from West Africa&#39;s most conflict-prone economy into its growth engine. His technocratic IMF background delivered genuine development results — though at the cost of controversial constitutional term-limit manipulation.",
    region: "Africa",
  },
  {
    id: "decroo",
    name: "Alexander De Croo",
    country: "Belgium",
    countryCode: "BE",
    flag: "🇧🇪",
    title: "Former Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Alexander_De_Croo_%28cropped%29.jpg/440px-Alexander_De_Croo_%28cropped%29.jpg",
    age: 49,
    birthYear: 1975,
    birthPlace: "Ghent, Belgium",
    education: [
      {
        institution: "Ghent University",
        degree: "B.A. Applied Economics",
        year: 1997,
      },
      {
        institution: "Stanford Graduate School of Business",
        degree: "M.B.A.",
        year: 2001,
      },
    ],
    party: "Open VLD (Flemish Liberals and Democrats)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2020, to: 2024 }],
    background:
      "Belgian tech entrepreneur turned politician who led the Vivaldi coalition — one of the largest coalitions in Belgian history spanning left to right across the linguistic divide. Resigned after his party&#39;s crushing defeat in the June 2024 elections.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Formed Vivaldi coalition after 16-month government formation crisis",
        impact: "positive",
      },
      {
        year: 2021,
        event: "Coordinated Belgium&#39;s EU Council presidency preparation",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Belgium holds EU Council presidency during critical Ukraine/Gaza period",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Open VLD collapses in June elections — De Croo resigns same night",
        impact: "negative",
      },
    ],
    achievements: [
      "Led Belgium through COVID-19 and energy crisis simultaneously",
      "Belgium&#39;s EU Council presidency navigated multiple geopolitical crises",
      "Nuclear energy phase-out reversed — two reactors extended by 10 years",
      "Belgian defence spending trajectory increased toward NATO target",
    ],
    politicalViews:
      "Liberal internationalist, pro-EU, pro-NATO, tech entrepreneur mindset applied to governance. Climate action but with nuclear pragmatism. Centrist on social issues with economic liberalism.",
    approvalRating: 28,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Led Belgium through one of its most difficult governing periods but paid the electoral price. Belgium&#39;s linguistic and political complexity makes coalition governance an art form, which De Croo practiced with rare success.",
    region: "Europe",
  },
  {
    id: "stoere",
    name: "Jonas Gahr Støre",
    country: "Norway",
    countryCode: "NO",
    flag: "🇳🇴",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Jonas_Gahr_St%C3%B8re_2021_official_portrait.jpg/440px-Jonas_Gahr_St%C3%B8re_2021_official_portrait.jpg",
    age: 64,
    birthYear: 1960,
    birthPlace: "Oslo, Norway",
    education: [
      {
        institution: "Sciences Po Paris",
        degree: "M.A. Political Science",
        year: 1986,
      },
    ],
    party: "Norwegian Labour Party (Ap)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Former Foreign Minister (2005–2012) and WHO Chief of Staff under Gro Harlem Brundtland. Became PM in 2021 after Erna Solberg&#39;s Conservative government. Manages Norway&#39;s extraordinary oil wealth through the $1.7 trillion Government Pension Fund Global while navigating NATO obligations and Arctic security.",
    significantEvents: [
      {
        year: 2021,
        event: "Won election; ended 8 years of Conservative rule",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Norway&#39;s gas exports to Europe surged — biggest beneficiary of Russia crisis",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Norwegian Government Pension Fund hits $1.7T — world&#39;s largest sovereign wealth fund",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Arctic security cooperation deepened with NATO amid Russian provocations",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Faces election amid cost of living concerns despite oil wealth",
        impact: "negative",
      },
    ],
    achievements: [
      "Norway&#39;s sovereign wealth fund surpassed $1.7 trillion",
      "Largest energy exporter to Europe after Russia pipeline cuts",
      "Arctic strategic partnership with NATO strengthened",
      "EV adoption — Norway reached 90%+ electric car sales share",
    ],
    politicalViews:
      "Social democratic, Nordic welfare state model. Advocates climate action (paradoxically while managing oil wealth). Atlantic alliance, Arctic sovereignty, Global South engagement. Believes sovereign wealth fund should be used for climate transition.",
    approvalRating: 34,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Governs the world&#39;s most affluent per-capita democracy at a time when Norway&#39;s gas exports define European energy security. The paradox of climate-conscious Norway profiting from Europe&#39;s gas emergency is the defining tension of his tenure.",
    region: "Europe",
  },
  {
    id: "frostadottir",
    name: "Kristrún Frostadóttir",
    country: "Iceland",
    countryCode: "IS",
    flag: "🇮🇸",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Krist%C3%ADn_Freest%C3%A1d%C3%B3ttir_2024_%28cropped%29.jpg/440px-Krist%C3%ADn_Freest%C3%A1d%C3%B3ttir_2024_%28cropped%29.jpg",
    age: 37,
    birthYear: 1987,
    birthPlace: "Reykjavík, Iceland",
    education: [
      {
        institution: "University of Iceland",
        degree: "B.A. History",
        year: 2010,
      },
      {
        institution: "University of Edinburgh",
        degree: "M.Sc. Economic & Social History",
        year: 2012,
      },
    ],
    party: "Social Democratic Alliance (Samfylkingin)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Economist and professor who became Iceland&#39;s youngest PM and one of the youngest heads of government in the world. Won the November 2024 election, succeeding Katrín Jakobsdóttir&#39;s Left-Green coalition after it lost support. Iceland is one of the world&#39;s most gender-equal and sustainable economies.",
    significantEvents: [
      {
        year: 2024,
        event: "Won election at age 37 — became Iceland&#39;s youngest PM",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Formed coalition amid housing crisis and immigration debate",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Navigates Iceland&#39;s volcanic activity crisis — Reykjanes eruptions",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Arctic Council chairmanship — Iceland&#39;s climate and fishing diplomacy",
        impact: "positive",
      },
    ],
    achievements: [
      "Iceland&#39;s youngest prime minister at 37",
      "Gender pay gap legislation — Iceland&#39;s equal pay certification world-leading",
      "100% renewable energy electricity maintained",
      "Arctic Council engagement on climate and fishing rights",
    ],
    politicalViews:
      "Social democratic, feminist economics, climate sustainability, Nordic welfare state. Pro-NATO (Iceland has no army), pro-EEA membership, fisheries sovereignty advocate. Progressive on social issues.",
    approvalRating: 52,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Leads the world&#39;s oldest parliament (Althing, 930 AD) at a critical moment of volcanic activity, housing stress, and Arctic great power competition. Iceland&#39;s outsized influence on NATO&#39;s northern flank belies its tiny population of 370,000.",
    region: "Europe",
  },
  {
    id: "martin",
    name: "Micheál Martin",
    country: "Ireland",
    countryCode: "IE",
    flag: "🇮🇪",
    title: "Taoiseach (Prime Minister)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Miche%C3%A1l_Martin_official_portrait_%282024%29.jpg/440px-Miche%C3%A1l_Martin_official_portrait_%282024%29.jpg",
    age: 64,
    birthYear: 1960,
    birthPlace: "Cork, Ireland",
    education: [
      {
        institution: "University College Cork",
        degree: "B.A. History",
        year: 1982,
      },
      {
        institution: "University College Cork",
        degree: "H.Dip. Education",
        year: 1983,
      },
      {
        institution: "University College Cork",
        degree: "M.A. History",
        year: 1985,
      },
    ],
    party: "Fianna Fáil",
    ideology: "Centrist",
    termsInOffice: [
      { from: 2020, to: 2022 },
      { from: 2024, to: "present" },
    ],
    background:
      "Veteran politician who first served as Taoiseach 2020–22 in Ireland&#39;s first-ever coalition between Fianna Fáil and Fine Gael alongside Sinn Féin. After the November 2024 election, led his party to a renewed coalition, replacing Simon Harris as Taoiseach under a rotation agreement.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Led unprecedented FF-FG-Green coalition — historic rivals in government together",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Ireland&#39;s corporation tax — agreed to 15% global minimum",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "November election — FF and FG hold on; Sinn Féin falls back",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Ireland&#39;s housing crisis remains defining political challenge",
        impact: "negative",
      },
    ],
    achievements: [
      "Formed historic Fianna Fáil-Fine Gael coalition — ended a century of rivalry",
      "Ireland became world&#39;s largest per-capita recipient of US FDI",
      "Celtic Tiger II — Ireland&#39;s GDP grew faster than any EU economy 2021–24",
      "Corporate tax windfall invested in National Reserve Fund",
    ],
    politicalViews:
      "Centre-right Christian democratic tradition. Pro-EU, pro-US relationship, strong on European sovereignty. Housing and public services investment. Traditionally nationalist (moderate) but firmly constitutional. Balances Irish neutrality with security realism.",
    approvalRating: 44,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Presides over Ireland&#39;s most economically consequential period — tech and pharma FDI has made Ireland punching above its weight globally. Housing shortfall is the risk that could unravel the Celtic Tiger II story.",
    region: "Europe",
  },
  {
    id: "fico",
    name: "Robert Fico",
    country: "Slovakia",
    countryCode: "SK",
    flag: "🇸🇰",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Robert_Fico_%282023%29.jpg/440px-Robert_Fico_%282023%29.jpg",
    age: 60,
    birthYear: 1964,
    birthPlace: "Topoľčany, Czechoslovakia (now Slovakia)",
    education: [
      { institution: "Comenius University", degree: "Law Degree", year: 1986 },
      {
        institution: "LSE",
        degree: "International Human Rights Law (scholarship)",
        year: 1996,
      },
    ],
    party: "SMER–Social Democracy",
    ideology: "Populist",
    termsInOffice: [
      { from: 2006, to: 2010 },
      { from: 2012, to: 2018 },
      { from: 2023, to: "present" },
    ],
    background:
      "Slovakia&#39;s most dominant political figure — served three terms as PM with interruptions. Won his fourth election in October 2023 on a pro-Russia, anti-Ukraine-aid platform. Shot and critically wounded in an assassination attempt in May 2024 — survived and returned to office within weeks, using the attack to reinforce his populist narrative.",
    significantEvents: [
      {
        year: 2018,
        event:
          "Resigned after journalist Ján Kuciak murdered while investigating Fico-linked corruption",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Won election on anti-Ukraine aid, pro-Russia platform",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Survived assassination attempt — shot 5 times in May 2024",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Visited Moscow and Kiev — positioned as peace broker",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Cut Slovakia&#39;s Ukraine military aid; blocked EU consensus repeatedly",
        impact: "negative",
      },
    ],
    achievements: [
      "Slovakia&#39;s longest-serving PM — led country through EU integration era",
      "Survived assassination — returned to office within weeks",
      "Navigated Slovakia through EU financial crisis years",
      "Maintained Slovak industrial base including Volkswagen presence",
    ],
    politicalViews:
      "Left-leaning populist — social spending at home, pro-Russia abroad. Anti-NATO expansion. Opposes Ukraine military aid. Friendly with Orbán and Putin. Sceptical of EU regulatory agenda. Anti-LGBTQ legislation.",
    approvalRating: 38,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "One of the most disruptive voices in EU–Ukraine consensus. After surviving assassination, re-emerged more radicalized in his Russia-friendly politics. Slovakia under Fico mirrors Hungary&#39;s EU vetoes but with more extreme rhetoric.",
    region: "Europe",
  },
  {
    id: "ciolacu",
    name: "Marcel Ciolacu",
    country: "Romania",
    countryCode: "RO",
    flag: "🇷🇴",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Marcel_Ciolacu_2023_%28cropped%29.jpg/440px-Marcel_Ciolacu_2023_%28cropped%29.jpg",
    age: 56,
    birthYear: 1968,
    birthPlace: "Buzău, Romania",
    education: [
      {
        institution: "Polytechnic Institute of Bucharest",
        degree: "B.Eng. Engineering",
        year: 1991,
      },
    ],
    party: "Social Democratic Party (PSD)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "President of the PSD and Speaker of the Romanian Parliament who became Prime Minister in June 2023. Romania is a NATO and EU member on the Black Sea — one of NATO&#39;s most strategically important eastern flank countries since the Ukraine war. Navigated Romania&#39;s dramatic 2024 constitutional crisis when a presidential election result was annulled.",
    significantEvents: [
      {
        year: 2023,
        event: "Became PM — leading Romania&#39;s enlarged coalition",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Romanian presidential election annulled — unprecedented EU constitutional crisis",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Romania enters Schengen Area — decades-long aspiration achieved",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "New presidential election held; Romania stabilised after crisis",
        impact: "positive",
      },
    ],
    achievements: [
      "Romania joined Schengen Area — historic achievement after years of delays",
      "GDP growth among the fastest in Eastern Europe",
      "NATO&#39;s Black Sea presence reinforced under Romanian government",
      "Energy independence — Romania&#39;s Black Sea gas fields development",
    ],
    politicalViews:
      "Centre-left social democratic, pro-EU, strong NATO advocate given proximity to Ukraine war. Romanian sovereignty, Black Sea energy development, EU structural funds maximisation. Pro-US security guarantees.",
    approvalRating: 32,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Romania&#39;s democratic crisis — when TikTok-amplified populist candidate Călin Georgescu won, then was annulled — became the EU&#39;s most alarming case of social media manipulation of elections. Ciolacu navigated the crisis but Romania&#39;s democratic stability remains under watch.",
    region: "Europe",
  },
  {
    id: "plenkovic",
    name: "Andrej Plenković",
    country: "Croatia",
    countryCode: "HR",
    flag: "🇭🇷",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Andrej_Plenkov%C3%A1%C4%8D_2024_%28cropped%29.jpg/440px-Andrej_Plenkov%C3%A1%C4%8D_2024_%28cropped%29.jpg",
    age: 54,
    birthYear: 1970,
    birthPlace: "Zagreb, Yugoslavia (now Croatia)",
    education: [
      { institution: "University of Zagreb", degree: "B.A. Law", year: 1994 },
      {
        institution: "University of Paris I (Panthéon-Sorbonne)",
        degree: "M.A. European Law",
        year: 1996,
      },
    ],
    party: "Croatian Democratic Union (HDZ)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2016, to: "present" }],
    background:
      "Former diplomat and MEP who served as Croatia&#39;s longest-serving PM since independence. Won a third consecutive term in April 2024 — remarkable stability in a region known for political turbulence. Croatia joined the Euro and Schengen during his tenure — completing its EU integration.",
    significantEvents: [
      {
        year: 2020,
        event: "Croatia joined OECD — economic credibility milestone",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Croatia joined the Eurozone — adopted euro on Jan 1",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Croatia entered Schengen — free movement with EU states",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Won third consecutive term — maintained HDZ majority",
        impact: "positive",
      },
    ],
    achievements: [
      "Croatia adopted the euro — Eurozone accession completed",
      "Schengen Area membership achieved",
      "Croatia&#39;s tourism record — highest visitor numbers in history",
      "NATO eastern flank contribution — Adriatic Sea security",
    ],
    politicalViews:
      "Conservative Christian democratic, pro-EU integration, pro-NATO. Western Balkans enlargement advocate. Balances Croatian national identity with Euro-Atlantic integration. Tough on migration through the Balkans corridor.",
    approvalRating: 43,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Completed Croatia&#39;s full EU integration by securing both Eurozone and Schengen membership — the most consequential achievement for any Croatian PM since independence. Provides a rare example of stable long-term EU conservative governance.",
    region: "Europe",
  },
  // ── BATCH 18: Taiwan, Central Asia, LatAm + UN ────────────────────────────
  {
    id: "lai",
    name: "Lai Ching-te",
    country: "Taiwan",
    countryCode: "TW",
    flag: "🇹🇼",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Lai_Ching-te_2024_official_portrait.jpg/440px-Lai_Ching-te_2024_official_portrait.jpg",
    age: 64,
    birthYear: 1959,
    birthPlace: "Wanli, Taipei County, Taiwan",
    education: [
      {
        institution: "National Cheng Kung University",
        degree: "B.Sc. Medicine",
        year: 1982,
      },
      {
        institution: "National Taiwan University",
        degree: "M.P.H. Public Health",
        year: 1990,
      },
      {
        institution: "Harvard University",
        degree: "M.P.H. (Masters in Public Health)",
        year: 1995,
      },
    ],
    party: "Democratic Progressive Party (DPP)",
    ideology: "Progressive",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Physician turned politician who served as Mayor of Tainan and Vice President under Tsai Ing-wen before winning the January 2024 presidential election. Known as 'Pragmatic Worker' domestically, Lai is seen by Beijing as a dangerous separatist — he has explicitly called Taiwan a sovereign independent country, making him the most provocative Taiwan president from China&#39;s perspective in decades.",
    significantEvents: [
      {
        year: 2024,
        event:
          "Won presidential election — DPP wins unprecedented third consecutive term",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "China launched military exercises around Taiwan days after his inauguration",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Taiwan Strait tensions reached new peak — PLA air incursions record high",
        impact: "negative",
      },
      {
        year: 2025,
        event: "US arms sales package approved despite China protests",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Taiwan Strait diplomacy — cautious messaging to avoid inadvertent escalation",
        impact: "neutral",
      },
    ],
    achievements: [
      "Led DPP to unprecedented third consecutive presidential win",
      "Taiwan&#39;s semiconductor industry — TSMC global dominance maintained",
      "Defence spending raised to 2.5% of GDP — largest increase in decades",
      "Taiwan&#39;s international recognition campaign — 13 formal allies maintained",
    ],
    politicalViews:
      "Pro-Taiwan independence within current parameters. Rejects &#39;one country, two systems&#39; absolutely. Strong US alliance, democratic identity diplomacy. Pragmatic on cross-strait trade while hardening defence posture. Semiconductor sovereignty — keeps TSMC under Taiwan&#39;s control.",
    approvalRating: 52,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs the world&#39;s most geopolitically explosive flashpoint — a democratic de facto state of 23 million that produces 90%+ of the world&#39;s most advanced chips. His presidency defines the most dangerous potential military confrontation of our era.",
    region: "Asia-Pacific",
  },
  {
    id: "mirziyoyev",
    name: "Shavkat Mirziyoyev",
    country: "Uzbekistan",
    countryCode: "UZ",
    flag: "🇺🇿",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Shavkat_Mirziyoyev_official_portrait.jpg/440px-Shavkat_Mirziyoyev_official_portrait.jpg",
    age: 67,
    birthYear: 1957,
    birthPlace: "Zaamin, Jizzakh Region, Uzbekistan",
    education: [
      {
        institution: "Tashkent Institute of Irrigation and Melioration",
        degree: "B.Eng. Agricultural Engineering",
        year: 1981,
      },
    ],
    party: "Liberal Democratic Party of Uzbekistan (UzLiDeP)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2016, to: "present" }],
    background:
      "Former Prime Minister who succeeded Islam Karimov — one of the most brutal Soviet-era strongmen — after Karimov&#39;s death in 2016. Promised and partially delivered a dramatic liberalisation compared to his predecessor: releasing thousands of political prisoners, ending forced labour in cotton harvests, opening borders with neighbours and pursuing foreign investment. Central Asia&#39;s most prominent reformist authoritarian.",
    significantEvents: [
      {
        year: 2016,
        event:
          "Succeeded Karimov — promised reform era; early prisoner releases",
        impact: "positive",
      },
      {
        year: 2017,
        event:
          "Five Central Asian leaders summit revived — Uzbekistan ends isolation",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Karakalpakstan protests over constitutional changes — security forces killed 18",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Uzbekistan&#39;s GDP growth among fastest in former Soviet space at 6%+",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Signed Comprehensive Partnership with EU — biggest Central Asia EU deal",
        impact: "positive",
      },
    ],
    achievements: [
      "Released thousands of Karimov-era political prisoners",
      "Ended forced child labour in cotton industry — internationally certified",
      "Five Central Asian summits revived — Uzbekistan as regional hub",
      "EU Comprehensive Partnership — Central Asia&#39;s most ambitious Western deal",
    ],
    politicalViews:
      "Reformist authoritarian — liberalises economically and socially while maintaining one-party state. Non-aligned multi-vector: cultivates Russia, China, EU, and US simultaneously. Anti-extremism focus domestically. Uzbekistan as Central Asia&#39;s hub for trade and connectivity.",
    approvalRating: 71,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "The most consequential Central Asian leader since independence — turned Uzbekistan from a hermetically sealed police state into a viable emerging market and regional diplomatic hub. His liberalisation without democratisation is Central Asia&#39;s defining governance experiment.",
    region: "Asia-Pacific",
  },
  {
    id: "rahmon",
    name: "Emomali Rahmon",
    country: "Tajikistan",
    countryCode: "TJ",
    flag: "🇹🇯",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Emomali_Rahmon_2021.jpg/440px-Emomali_Rahmon_2021.jpg",
    age: 72,
    birthYear: 1952,
    birthPlace: "Dangara, Tajik SSR (now Tajikistan)",
    education: [
      {
        institution: "Tajik State National University",
        degree: "B.A. Economics",
        year: 1982,
      },
      {
        institution: "Russian Academy of Sciences",
        degree: "Ph.D. Economics",
        year: 1997,
      },
    ],
    party: "People&#39;s Democratic Party of Tajikistan (PDPT)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 1992, to: "present" }],
    background:
      "Kolkhoz chairman who rose to power during the Tajik Civil War (1992–1997) and has ruled ever since — making him Central Asia&#39;s longest-serving president and one of the world&#39;s longest-serving authoritarian leaders. His son Rustam Rahmon was appointed First Deputy PM in 2020 — a clear succession grooming.",
    significantEvents: [
      {
        year: 1997,
        event:
          "Peace agreement ended Tajik Civil War — Rahmon consolidated power",
        impact: "positive",
      },
      {
        year: 2015,
        event:
          "Islamic Renaissance Party banned — only legal Islamic party in former USSR eliminated",
        impact: "negative",
      },
      {
        year: 2020,
        event: "Son Rustam appointed First Deputy PM — dynasty consolidation",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Border war with Kyrgyzstan — deadliest ex-Soviet border conflict in years",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Afghanistan border security crisis as Taliban took power next door",
        impact: "negative",
      },
    ],
    achievements: [
      "Ended Tajik Civil War through peace agreement",
      "Rogun Dam — world&#39;s tallest dam under construction; energy independence goal",
      "Tajikistan&#39;s stability maintained as Afghanistan collapsed next door",
      "Longest-serving Central Asian leader — 30+ years of continuous rule",
    ],
    politicalViews:
      "Secular authoritarian nationalist. Anti-Islamism — bans beards and hijabs in government settings. Deep Russia and China dependency for security and investment. Family dynasty consolidation. No political opposition tolerated.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Rules Central Asia&#39;s poorest nation — 37% of GDP comes from remittances of Tajiks working in Russia. His 30-year reign has maintained stability at the cost of all freedoms, while building a family dynasty that controls the state.",
    region: "Asia-Pacific",
  },
  {
    id: "orsi",
    name: "Yamandú Orsi",
    country: "Uruguay",
    countryCode: "UY",
    flag: "🇺🇾",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Yamand%C3%BA_Orsi_2025_official_portrait.jpg/440px-Yamand%C3%BA_Orsi_2025_official_portrait.jpg",
    age: 57,
    birthYear: 1967,
    birthPlace: "Canelones, Uruguay",
    education: [
      {
        institution: "University of the Republic (UdelaR)",
        degree: "B.A. History",
        year: 1991,
      },
      {
        institution: "University of the Republic (UdelaR)",
        degree: "Teaching Diploma",
        year: 1993,
      },
    ],
    party: "Frente Amplio (Broad Front)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2025, to: "present" }],
    background:
      "Former Mayor of Canelones department and history teacher who won Uruguay&#39;s November 2024 election, restoring the Frente Amplio coalition to power after five years of Luis Lacalle Pou&#39;s liberal government. Uruguay is Latin America&#39;s most stable democracy — its governance quality, press freedom, and social indicators are the region&#39;s gold standard.",
    significantEvents: [
      {
        year: 2024,
        event: "Won presidential election — Frente Amplio returns to power",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Inaugurated as president — first former mayor to win the presidency",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Announced social housing and public education investment programme",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Mercosur–EU trade deal ratification process engagement",
        impact: "positive",
      },
    ],
    achievements: [
      "Won Uruguay&#39;s presidency as former local government leader",
      "Represents Frente Amplio&#39;s return after five years in opposition",
      "Uruguay&#39;s democratic continuity — peaceful transfer from right to left",
      "Latin America&#39;s most stable democratic governance model preserved",
    ],
    politicalViews:
      "Centre-left social democratic, welfare state investment, Frente Amplio coalition values. Pro-Mercosur trade, regional integration, multilateralism. Human rights tradition — Uruguay processed its dictatorship crimes more thoroughly than most LatAm nations. Cannabis and social liberalisation legacy maintained.",
    approvalRating: 58,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs Latin America&#39;s most admired democracy — a small nation that consistently outperforms its neighbours on every human development metric. Uruguay is the proof-of-concept that stable social democracy works in Latin America.",
    region: "Americas",
  },
  {
    id: "ortega",
    name: "Daniel Ortega",
    country: "Nicaragua",
    countryCode: "NI",
    flag: "🇳🇮",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Daniel_Ortega_%282015%29.jpg/440px-Daniel_Ortega_%282015%29.jpg",
    age: 79,
    birthYear: 1945,
    birthPlace: "La Libertad, Chontales, Nicaragua",
    education: [
      {
        institution: "Central American University (UCA)",
        degree: "Law (incomplete)",
        year: 1967,
      },
    ],
    party: "Sandinista National Liberation Front (FSLN)",
    ideology: "Authoritarian",
    termsInOffice: [
      { from: 1979, to: 1990 },
      { from: 2007, to: "present" },
    ],
    background:
      "Former Sandinista guerrilla who helped topple the Somoza dictatorship in 1979, led revolutionary Nicaragua, lost the 1990 election, and returned to power democratically in 2007 — before systematically dismantling all democratic institutions. Rules with his wife Rosario Murillo as co-president in what is effectively Central America&#39;s last family dictatorship. Has expelled, jailed, or stripped citizenship from virtually the entire opposition.",
    significantEvents: [
      {
        year: 2018,
        event:
          "Nationwide protests brutally suppressed — 300+ killed, thousands jailed",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "All major presidential candidates jailed before election — won with 75%",
        impact: "negative",
      },
      {
        year: 2022,
        event: "Nicaragua withdraws from OAS; expelled from regional bodies",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Expelled 222 political prisoners to US in one day — largest mass expulsion in Latin America",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Catholic bishops expelled; Church properties seized",
        impact: "negative",
      },
    ],
    achievements: [
      "Led Sandinista revolution that ended Somoza&#39;s 43-year dynasty in 1979",
      "Nicaragua&#39;s literacy campaign of 1980 reduced illiteracy from 52% to 12%",
      "Survived 1990 electoral defeat and returned through democratic process",
      "Maintained power despite US sanctions and complete regional isolation",
    ],
    politicalViews:
      "Originally revolutionary socialist — now personal authoritarian dynasty. Anti-US imperialism, anti-Catholic hierarchy (despite once courting Church). State capitalism through family-controlled enterprises. Aligns with Venezuela, Cuba, Russia, and China. Wife Rosario Murillo controls messaging and day-to-day governance.",
    approvalRating: 22,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "Transformed from liberation hero into one of the Western Hemisphere&#39;s most brutal authoritarian leaders. Nicaragua&#39;s mass expulsion of political prisoners and expulsion of foreign missionaries marks a regime increasingly disconnected from even cynical international legitimacy.",
    region: "Americas",
  },
  {
    id: "guterres",
    name: "António Guterres",
    country: "United Nations",
    countryCode: "UN",
    flag: "🌐",
    title: "UN Secretary-General",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Ant%C3%B3nio_Guterres_%28cropped_2019%29.jpg/440px-Ant%C3%B3nio_Guterres_%28cropped_2019%29.jpg",
    age: 75,
    birthYear: 1949,
    birthPlace: "Lisbon, Portugal",
    education: [
      {
        institution: "Instituto Superior Técnico, Lisbon",
        degree: "B.Sc. Physics & Electrical Engineering",
        year: 1971,
      },
    ],
    party: "Socialist Party of Portugal (historical) / UN institutional",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2017, to: "present" }],
    background:
      "Former Prime Minister of Portugal (1995–2002) and UN High Commissioner for Refugees (2005–2015) who became UN Secretary-General in 2017, re-appointed in 2021. Leads the world&#39;s most complex multilateral institution through an era of polycrisis — climate emergency, Ukraine war, Gaza conflict, and the rise of AI — with the structural limitations of Security Council gridlock.",
    significantEvents: [
      {
        year: 2017,
        event:
          "Became 9th UN Secretary-General after Refugee Commissioner tenure",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Ukraine war — UN largely sidelined by Russian Security Council veto",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          '"Boiling era" speech — most forceful climate warning by any UN leader',
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Gaza conflict — called for ceasefire repeatedly; vetoed by US in Security Council",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Summit of the Future — reforming global governance for AI and climate era",
        impact: "positive",
      },
    ],
    achievements: [
      "UN refugee system scaled to 100M+ displaced people globally",
      "Paris Agreement implementation champion",
      "Black Sea Grain Initiative co-brokered with Turkey",
      "Summit of the Future — most ambitious UN governance reform since 1945",
    ],
    politicalViews:
      "Centre-left multilateralist. Climate urgency absolutist, human rights universalist, anti-nuclear. Advocates Security Council reform to reflect 21st century power realities. Global governance reform to address AI, pandemics, and climate as existential threats.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Leads humanity&#39;s most important multilateral institution at its most challenged moment since founding. Security Council paralysis limits his power, but his moral voice on climate, Gaza, and AI governance carries weight no individual state can replicate.",
    region: "Europe",
  },
  {
    id: "biya",
    name: "Paul Biya",
    country: "Cameroon",
    countryCode: "CM",
    flag: "🇨🇲",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Paul_Biya_2016_%28cropped%29.jpg/440px-Paul_Biya_2016_%28cropped%29.jpg",
    age: 91,
    birthYear: 1933,
    birthPlace: "Mvomeka&#39;a, Cameroon",
    education: [
      {
        institution: "Louis-le-Grand, Paris",
        degree: "Classical Studies",
        year: 1956,
      },
      {
        institution: "University of Paris (Sorbonne)",
        degree: "B.A. Public Law",
        year: 1961,
      },
      {
        institution: "Institut des Hautes Etudes d&#39;Outre-Mer",
        degree: "Post-graduate Administration",
        year: 1962,
      },
    ],
    party: "Cameroon People&#39;s Democratic Movement (RDPC)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 1982, to: "present" }],
    background:
      "Africa&#39;s longest-serving non-royal head of state and one of the world&#39;s oldest sitting leaders at 91. Has ruled Cameroon since 1982 — over 42 years. Spends months each year at the Hotel Intercontinental in Geneva while his country faces multiple active insurgencies. The Anglophone Crisis — a separatist conflict in Cameroon&#39;s English-speaking regions — has killed 6,000+ since 2017.",
    significantEvents: [
      {
        year: 1982,
        event: "Succeeded Ahidjo as President — initially seen as reformist",
        impact: "neutral",
      },
      {
        year: 2011,
        event:
          "Constitutional term limit removed — paved way for indefinite rule",
        impact: "negative",
      },
      {
        year: 2016,
        event:
          "Anglophone Crisis begins over French dominance — becomes armed separatist war",
        impact: "negative",
      },
      {
        year: 2018,
        event: "Re-elected with 71% amid Anglophone boycott and violence",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          'Spent record time in Geneva "working" while civil war continued',
        impact: "negative",
      },
    ],
    achievements: [
      "Cameroon&#39;s stability relative to Central African neighbours maintained for decades",
      "Oil revenues managed through Cameroon&#39;s SONARA refinery",
      "Longest-serving non-royal African president — 42+ years",
      "Kept Cameroon out of the worst Sahel-style coups despite regional trend",
    ],
    politicalViews:
      "At 91 and 42+ years in power, Biya is a case study in gerontocratic African authoritarianism sustained by French patronage. The Anglophone Crisis he created — through neglect and suppression — is Cameroon&#39;s defining tragedy, with 700,000+ displaced.",
    approvalRating: null,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "At 91 and 42+ years in power, Biya is a case study in gerontocratic African authoritarianism sustained by French patronage. The Anglophone Crisis he created — through neglect and suppression — is Cameroon&#39;s defining tragedy, with 700,000+ displaced.",
    region: "Africa",
  },
  // ── BATCH 20: Georgia PM, S.Korea, Costa Rica, CAR, Eritrea, Comoros, Chad ──
  {
    id: "kobakhidze",
    name: "Giorgi Kobakhidze",
    country: "Georgia",
    countryCode: "GE",
    flag: "🇬🇪",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Giorgi_Kobakhidze_2024_official_portrait.jpg/440px-Giorgi_Kobakhidze_2024_official_portrait.jpg",
    age: 46,
    birthYear: 1978,
    birthPlace: "Tbilisi, Georgian SSR (now Georgia)",
    education: [
      {
        institution: "Tbilisi State University",
        degree: "B.A. Law",
        year: 2001,
      },
      {
        institution: "University of Hamburg",
        degree: "Ph.D. Law",
        year: 2009,
      },
    ],
    party: "Georgian Dream",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Constitutional law scholar who became Georgian Dream party chairman in 2023 and Prime Minister in February 2024. Led Georgian Dream to a contested parliamentary election victory in October 2024 — triggering the largest protests in Georgian history as the opposition and President Zourabichvili declared the vote fraudulent. His government&#39;s suspension of EU accession talks in November 2024 was the spark for months of pro-EU street demonstrations.",
    significantEvents: [
      {
        year: 2024,
        event: "Became PM replacing Irakli Garibashvili in February",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Led Georgian Dream to contested October election — opposition declared fraud",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Suspended EU accession negotiations until 2028 — mass protests erupted",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Pro-EU protests continued for months; police used force on demonstrators",
        impact: "negative",
      },
      {
        year: 2025,
        event: "EU suspended Georgian accession process and froze some funds",
        impact: "negative",
      },
    ],
    achievements: [
      "Held Georgian Dream&#39;s parliamentary majority through contested election",
      "Constitutional law expertise applied to governance framework",
      "Maintained Georgia&#39;s economic growth trajectory",
      "Avoided direct military confrontation with Russia despite tensions",
    ],
    politicalViews:
      "Officially pro-EU but de facto pivoting toward Russia-aligned authoritarian model. Frames EU demands as interference in Georgian sovereignty. Anti-NGO law modelled on Russian foreign agents legislation. Positions Georgia as &#39;neutral&#39; between Russia and West.",
    approvalRating: 34,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "His suspension of EU accession negotiations triggered Georgia&#39;s worst political crisis since the 2008 Russian war — with hundreds of thousands in the streets demanding a pro-EU future. He represents Georgian Dream&#39;s decisive turn away from European integration.",
    region: "Europe",
  },
  {
    id: "yoon",
    name: "Yoon Suk-yeol",
    country: "South Korea",
    countryCode: "KR",
    flag: "🇰🇷",
    title: "Former President (Impeached)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Yoon_Suk-yeol_official_portrait.jpg/440px-Yoon_Suk-yeol_official_portrait.jpg",
    age: 64,
    birthYear: 1960,
    birthPlace: "Seoul, South Korea",
    education: [
      {
        institution: "Seoul National University",
        degree: "B.A. Law",
        year: 1982,
      },
      {
        institution: "Seoul National University",
        degree: "M.A. Law",
        year: 1984,
      },
    ],
    party: "People Power Party (PPP)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2022, to: 2025 }],
    background:
      "Former Prosecutor General who won the 2022 presidential election by just 0.73%. In December 2024 declared martial law — a 6-hour constitutional crisis parliament overturned. Impeached twice, arrested, and removed from office by the Constitutional Court in April 2025.",
    significantEvents: [
      {
        year: 2022,
        event: "Won presidency by 0.73% — closest election in Korean history",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Moved presidential office from Blue House to Defence Ministry",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Declared martial law citing &#39;anti-state forces&#39; — lasted 6 hours",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "National Assembly overturned martial law within hours; impeached",
        impact: "negative",
      },
      {
        year: 2025,
        event: "Constitutional Court upheld impeachment; removed from office",
        impact: "negative",
      },
    ],
    achievements: [
      "Strengthened South Korea&#39;s US alliance — Camp David trilateral with US-Japan",
      "Moved presidential office to improve democratic accessibility symbolically",
      "NATO outreach — South Korea&#39;s deepest NATO engagement ever",
      "Completed Camp David Accords — first US-Japan-South Korea summit framework",
    ],
    politicalViews:
      "Hard-line conservative, fierce anti-communist, hawkish on North Korea. Strong US alliance, Japan rapprochement. Pro-business free market. His martial law declaration revealed authoritarian tendencies beneath the conservative veneer.",
    approvalRating: 11,
    approvalTrend: "down",
    status: "Former",
    impact:
      "His martial law declaration was the most serious assault on South Korean democracy since the 1980 coup — and democracy&#39;s survival proved the strength of Korean institutions. He will be remembered primarily for the crisis that ended his presidency.",
    region: "Asia-Pacific",
  },
  {
    id: "chaves",
    name: "Rodrigo Chaves Robles",
    country: "Costa Rica",
    countryCode: "CR",
    flag: "🇨🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Rodrigo_Chaves_Robles_2022_official_portrait.jpg/440px-Rodrigo_Chaves_Robles_2022_official_portrait.jpg",
    age: 64,
    birthYear: 1960,
    birthPlace: "San José, Costa Rica",
    education: [
      {
        institution: "University of Costa Rica",
        degree: "B.A. Economics",
        year: 1984,
      },
      {
        institution: "Ohio State University",
        degree: "M.A. Economics",
        year: 1989,
      },
      {
        institution: "Ohio State University",
        degree: "Ph.D. Economics",
        year: 1991,
      },
    ],
    party: "Social Democratic Progress Party (PPSD)",
    ideology: "Populist",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Former World Bank senior economist who spent 26 years at the institution before returning to Costa Rica and winning the 2022 presidential election as a populist outsider — despite being investigated for sexual harassment at the World Bank. Founded his own party and won with 53% in the runoff, upending Costa Rica&#39;s traditional two-party system.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Won presidential election as political outsider — founded own party",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Costa Rica declared cyberwar state — ransomware attacks on government",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Intel expanded Costa Rica campus — chip packaging investment",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Populist attacks on judiciary and press become governing style",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Re-election campaign announced amid polarised political landscape",
        impact: "neutral",
      },
    ],
    achievements: [
      "Disrupted Costa Rica&#39;s two-party duopoly",
      "Intel and semiconductor investment expanded under his tech-friendly governance",
      "Costa Rica maintained 100% renewable electricity during his tenure",
      "Anti-corruption populist messaging resonated with disillusioned voters",
    ],
    politicalViews:
      "Populist technocrat — combines World Bank economist credentials with anti-establishment rhetoric. Pro-business, pro-FDI especially in tech sector. Critical of traditional political parties and institutions. Uses social media to bypass mainstream press.",
    approvalRating: 37,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Broke Costa Rica&#39;s traditional centrist political model — his populist governing style is eroding the institutional norms that have made Costa Rica Central America&#39;s most stable democracy for 75 years.",
    region: "Americas",
  },
  {
    id: "touadera",
    name: "Faustin-Archange Touadéra",
    country: "Central African Republic",
    countryCode: "CF",
    flag: "🇨🇫",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Faustin-Archange_Touad%C3%A9ra_2020_%28cropped%29.jpg/440px-Faustin-Archange_Touad%C3%A9ra_2020_%28cropped%29.jpg",
    age: 66,
    birthYear: 1957,
    birthPlace: "Bangui, Central African Republic",
    education: [
      {
        institution: "University of Bangui",
        degree: "B.Sc. Mathematics",
        year: 1981,
      },
      {
        institution: "University of Lille",
        degree: "Ph.D. Mathematics",
        year: 1994,
      },
    ],
    party: "United Hearts Movement (MCU)",
    ideology: "Centrist",
    termsInOffice: [{ from: 2016, to: "present" }],
    background:
      "Mathematics professor and former Prime Minister who became CAR&#39;s President in 2016 and was re-elected in 2021 in a disputed vote. His presidency is defined by one fact above all others: the invitation of Russia&#39;s Wagner Group (now Africa Corps) to provide security after France&#39;s partial withdrawal. CAR is one of the world&#39;s most resource-rich yet conflict-devastated countries — diamonds, gold, uranium, and timber, yet ranked the world&#39;s least developed nation.",
    significantEvents: [
      {
        year: 2016,
        event: "Won first presidential election — mathematician turned leader",
        impact: "positive",
      },
      {
        year: 2018,
        event:
          "Invited Wagner Group as presidential security force and military trainer",
        impact: "neutral",
      },
      {
        year: 2021,
        event: "Re-elected in disputed vote with Wagner&#39;s backing",
        impact: "negative",
      },
      {
        year: 2023,
        event: "New constitution removes presidential term limits",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Wagner/Africa Corps becomes largest operational force in CAR",
        impact: "negative",
      },
    ],
    achievements: [
      "Khartoum Process — peace agreement signed with 14 armed groups in 2019",
      "Partial security stabilisation of Bangui through Russian security presence",
      "CAR&#39;s gold and diamond sector foreign investment maintained",
      "Maintained formal statehood of one of the world&#39;s most fragile nations",
    ],
    politicalViews:
      "Pragmatic survivalist. Initially balanced French and Russian security ties, now almost entirely dependent on Russia&#39;s Africa Corps. Resource sovereignty rhetoric. Governing a rump state — 80% of CAR&#39;s territory outside government control.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His invite of Wagner Group is the defining case of Russia&#39;s Africa Corps model — security for resource concessions and political loyalty. CAR became the template that spread to Mali, Burkina, Niger, Libya, and Sudan.",
    region: "Africa",
  },
  {
    id: "afwerki",
    name: "Isaias Afwerki",
    country: "Eritrea",
    countryCode: "ER",
    flag: "🇪🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Isaias_Afwerki_2011_%28cropped%29.jpg/440px-Isaias_Afwerki_2011_%28cropped%29.jpg",
    age: 78,
    birthYear: 1946,
    birthPlace: "Asmara, Eritrea (then Italian East Africa)",
    education: [
      {
        institution: "University of Addis Ababa",
        degree: "Engineering (incomplete)",
        year: 1967,
      },
      {
        institution: "Marxist guerrilla training, China",
        degree: "Military-political training",
        year: 1968,
      },
    ],
    party: "People&#39;s Front for Democracy and Justice (PFDJ)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 1993, to: "present" }],
    background:
      "Led the Eritrean People&#39;s Liberation Front to independence from Ethiopia in 1993 after a 30-year war — initially hailed as an African liberation hero. Never held an election. Rules one of the world&#39;s most isolated and militarised states — sometimes called &#39;Africa&#39;s North Korea.&#39; Operates an indefinite national military service that human rights organisations call forced labour. Hundreds of thousands of Eritreans have fled, making Eritrea one of the world&#39;s top per-capita sources of refugees.",
    significantEvents: [
      {
        year: 1993,
        event:
          "Eritrea wins independence from Ethiopia — Afwerki becomes president",
        impact: "positive",
      },
      {
        year: 1998,
        event:
          "Eritrea-Ethiopia border war begins — 100,000 killed over two years",
        impact: "negative",
      },
      {
        year: 2018,
        event: "Abiy Ahmed peace deal ends 20-year state of war with Ethiopia",
        impact: "positive",
      },
      {
        year: 2020,
        event: "Eritrean troops invaded Tigray — massacres documented",
        impact: "negative",
      },
      {
        year: 2022,
        event: "Eritrean Defence Forces refused to withdraw from Tigray",
        impact: "negative",
      },
    ],
    achievements: [
      "Won Eritrean independence after 30-year liberation struggle",
      "Maintained state sovereignty despite zero international investment",
      "Peace deal with Ethiopia in 2018 — ended 20-year war",
      "Eritrea remained outside IMF-World Bank dependency despite poverty",
    ],
    politicalViews:
      "Revolutionary socialist turned pure autocrat. Anti-Western, anti-IMF, state control of all economic activity. &#39;Self-reliance&#39; ideology — refuses all foreign aid. Military-first absolute state. No political parties, no elections, no civil society.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Runs what the UN Human Rights Council called a state with &#39;crimes against humanity&#39; — indefinite conscription, secret detention, extrajudicial killings. 500,000+ Eritreans have fled, making it a top source of Mediterranean migrants. One of the world&#39;s most complete authoritarian models.",
    region: "Africa",
  },
  {
    id: "assoumani",
    name: "Azali Assoumani",
    country: "Comoros",
    countryCode: "KM",
    flag: "🇰🇲",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Azali_Assoumani_2019_%28cropped%29.jpg/440px-Azali_Assoumani_2019_%28cropped%29.jpg",
    age: 65,
    birthYear: 1959,
    birthPlace: "Mitsoudjé, Comoros",
    education: [
      {
        institution: "Military Academy Antsirabe, Madagascar",
        degree: "Military Training",
        year: 1980,
      },
      {
        institution: "École Supérieure Militaire de Saint-Cyr, France",
        degree: "Advanced Military Studies",
        year: 1988,
      },
    ],
    party: "Convention for the Renewal of the Comoros (CRC)",
    ideology: "Authoritarian",
    termsInOffice: [
      { from: 1999, to: 2006 },
      { from: 2016, to: "present" },
    ],
    background:
      "Military officer who staged a coup in 1999, then handed power over after elections, then won back the presidency in 2016. Manipulated a 2018 constitutional referendum to extend his powers and enable a third term — triggering opposition protests and international condemnation. Served as African Union Chairperson in 2023 — his most prominent international role. The Comoros has experienced over 20 coups since independence — the world&#39;s highest rate per capita.",
    significantEvents: [
      {
        year: 1999,
        event: "Staged coup — first stint in power begins",
        impact: "negative",
      },
      {
        year: 2016,
        event: "Won presidential election — returned to power through ballot",
        impact: "neutral",
      },
      {
        year: 2018,
        event:
          "Constitutional referendum concentrated power, enabled third-term bid",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Became African Union Chairperson — rare international prominence",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Won disputed third term in January election — 63% claimed",
        impact: "negative",
      },
    ],
    achievements: [
      "Served as African Union Chair 2023 — elevated Comoros internationally",
      "Maintained Comoran statehood through chronic instability",
      "Promoted Indian Ocean island-state climate vulnerability agenda",
      "Economic ties with China and Gulf states expanded",
    ],
    politicalViews:
      "Conservative military nationalist, Islam as state identity, Gulf-friendly economic model. Uses AU chairmanship for legitimacy. Climate vulnerability diplomacy — Comoros at sea level rise risk. Anti-opposition through constitutional manipulation.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "Incumbent (Disputed)",
    impact:
      "In a country with the world&#39;s highest per-capita coup record, Assoumani&#39;s ability to survive two power returns is remarkable. His AU chairmanship gave the Comoros more international visibility than any prior moment in its post-independence history.",
    region: "Africa",
  },
  {
    id: "deby",
    name: "Mahamat Idriss Déby",
    country: "Chad",
    countryCode: "TD",
    flag: "🇹🇩",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Mahamat_Idriss_D%C3%A9by_2021_%28cropped%29.jpg/440px-Mahamat_Idriss_D%C3%A9by_2021_%28cropped%29.jpg",
    age: 41,
    birthYear: 1984,
    birthPlace: "N&#39;Djamena, Chad",
    education: [
      {
        institution: "Military Academy of Saint-Cyr, France",
        degree: "Military Officer Training",
        year: 2004,
      },
      {
        institution: "Army War College, Paris",
        degree: "Advanced Military Studies",
        year: 2011,
      },
    ],
    party: "Patriotic Salvation Movement (MPS)",
    ideology: "Military Junta",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Son of Idriss Déby Itno who ruled Chad for 30 years until he was killed on the front lines the day after winning his sixth presidential term in April 2021. The military immediately installed his 37-year-old son as head of a Transitional Military Council — a direct dynastic succession that Chad&#39;s constitution did not allow. Won a controversial presidential election in May 2024 that international observers criticised. Chad is one of France&#39;s closest African security partners — home to France&#39;s largest African military base.",
    significantEvents: [
      {
        year: 2021,
        event:
          "Installed as leader hours after father killed in combat — constitutional coup",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Doha National Dialogue — opposition consulted; transition timeline set",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Referendum approves presidential republic — cementing his path to election",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Won presidential election with 61% — critics allege manipulation",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Chad expelled French forces — dramatic reversal of decades of alliance",
        impact: "negative",
      },
    ],
    achievements: [
      "Managed Sahel security partnership for France and US — MINUSMA and Barkhane successor roles",
      "Doha political dialogue brought major opposition factions to table",
      "Transitioned from military council to elected presidency within 3 years",
      "Chad maintained relative stability as neighbours fell to coups",
    ],
    politicalViews:
      "Military nationalist, dynastic continuity. Initially France-aligned (father&#39;s model) then expelled French forces in 2024 — hedging toward Russia-Gulf axis like Sahel neighbours. Lake Chad basin security leadership. Resource sovereigntist — oil managed through politically connected SHT company.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His expulsion of French forces in 2024 marked the end of France&#39;s most strategically important African military relationship — completing the collapse of Paris&#39;s Sahel security architecture. At 41, he&#39;s the youngest major African leader and represents the new generation of post-French African military rulers.",
    region: "Africa",
  },
  // ── BATCH 19: North/West Africa, Central Africa, Botswana, C. America, Guyana ──
  {
    id: "akhannouch",
    name: "Aziz Akhannouch",
    country: "Morocco",
    countryCode: "MA",
    flag: "🇲🇦",
    title: "Prime Minister (Head of Government)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Aziz_Akhannouch_2021_%28cropped%29.jpg/440px-Aziz_Akhannouch_2021_%28cropped%29.jpg",
    age: 62,
    birthYear: 1961,
    birthPlace: "Taroudannt, Morocco",
    education: [
      {
        institution: "Laval University, Quebec",
        degree: "B.Sc. Business Administration",
        year: 1985,
      },
      {
        institution: "Laval University, Quebec",
        degree: "M.B.A.",
        year: 1988,
      },
    ],
    party: "National Rally of Independents (RNI)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Billionaire agribusiness magnate who inherited and expanded Akwa Group — Morocco&#39;s largest private company covering petroleum distribution, real estate, and agriculture. Entered politics from business, long served as Agriculture Minister. Won the 2021 elections decisively, ending the Islamist PJD&#39;s decade in government. Known as one of Africa&#39;s wealthiest heads of government.",
    significantEvents: [
      {
        year: 2021,
        event:
          "Led RNI to election victory — ended PJD Islamist decade in power",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Morocco hosted record tourist numbers post-COVID recovery",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "FIFA World Cup 2022 — Morocco reached semfinals; unprecedented Arab milestone",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Al Haouz earthquake killed 3,000+ — reconstruction programme launched",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Morocco-EU migration deal deepened; EU paid Morocco €500M+ for border control",
        impact: "positive",
      },
    ],
    achievements: [
      "Morocco reached FIFA World Cup semifinals — first African and Arab nation",
      "Green Generation agricultural programme expanded",
      "EU migration partnership — Morocco as key Southern neighbour",
      "Morocco nominated for 2030 FIFA World Cup co-hosting",
    ],
    politicalViews:
      "Pro-business liberal, Western-aligned, modernising within Moroccan monarchy constraints. Atlantic relationship — Morocco normalised with Israel in 2020 Abraham Accords. EU Partnership deepened. Pragmatic on migration as leverage over Europe. Sahara sovereignty absolutist.",
    approvalRating: 44,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs Morocco at its most geopolitically consequential moment — a key EU migration partner, African gateway economy, and increasingly significant player in Middle East diplomacy after Abraham Accords normalisation with Israel.",
    region: "Africa",
  },
  {
    id: "barrow",
    name: "Adama Barrow",
    country: "Gambia",
    countryCode: "GM",
    flag: "🇬🇲",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Adama_Barrow_2017_%28cropped%29.jpg/440px-Adama_Barrow_2017_%28cropped%29.jpg",
    age: 59,
    birthYear: 1965,
    birthPlace: "Mankamang Kunda, Upper River Region, Gambia",
    education: [
      {
        institution: "Gambia High School",
        degree: "Secondary Education",
        year: 1987,
      },
      {
        institution: "London Metropolitan University",
        degree: "Certificate in Property Development",
        year: 2006,
      },
    ],
    party: "National People&#39;s Party (NPP)",
    ideology: "Centrist",
    termsInOffice: [{ from: 2017, to: "present" }],
    background:
      "Former estate agent and supermarket security guard who united the Gambian opposition and stood as their consensus candidate against Yahya Jammeh — Africa&#39;s most erratic dictator who ruled for 22 years. Won the December 2016 election against all odds, forcing Jammeh into exile with ECOWAS military intervention when he refused to hand over power. One of Africa&#39;s most remarkable democratic transition stories.",
    significantEvents: [
      {
        year: 2016,
        event: "Won election defeating 22-year dictator Yahya Jammeh",
        impact: "positive",
      },
      {
        year: 2017,
        event:
          "Jammeh exiled to Equatorial Guinea after ECOWAS military ultimatum",
        impact: "positive",
      },
      {
        year: 2021,
        event: "Won re-election — confirmed democratic consolidation",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "TRRC report — Jammeh era crimes documented; calls for prosecution",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Gambia&#39;s Truth, Reconciliation and Reparations Commission concluded",
        impact: "positive",
      },
    ],
    achievements: [
      "Ended Jammeh&#39;s 22-year dictatorship through democratic election",
      "Truth and Reconciliation Commission completed",
      "Gambia rejoined Commonwealth and ICC after Jammeh-era withdrawals",
      "ECOWAS military intervention model — peaceful transition via regional force",
    ],
    politicalViews:
      "Pragmatic centrist, democratic consolidation, rule of law restoration. Pro-Commonwealth, pro-ECOWAS, Western-aligned development partnerships. Gambia&#39;s tiny economy ($2B GDP) makes foreign aid and tourism dependency defining political constraints.",
    approvalRating: 52,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His 2016 victory is one of Africa&#39;s most celebrated democratic moments — an ordinary man who united a divided opposition and defeated a brutal dictator. Gambia&#39;s transition demonstrates that ECOWAS-backed democratic restoration is possible in West Africa.",
    region: "Africa",
  },
  {
    id: "sassou",
    name: "Denis Sassou Nguesso",
    country: "Rep. of Congo",
    countryCode: "CG",
    flag: "🇨🇬",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Denis_Sassou_Nguesso_%282015%29.jpg/440px-Denis_Sassou_Nguesso_%282015%29.jpg",
    age: 80,
    birthYear: 1943,
    birthPlace: "Edou, Alima, Republic of Congo",
    education: [
      {
        institution: "Saint-Cyr Military Academy, France",
        degree: "Military Officer Training",
        year: 1966,
      },
    ],
    party: "Congolese Labour Party (PCT)",
    ideology: "Authoritarian",
    termsInOffice: [
      { from: 1979, to: 1992 },
      { from: 1997, to: "present" },
    ],
    background:
      "Military officer who has ruled the Republic of Congo (Congo-Brazzaville) for a total of 45+ years across two stints — making him Africa&#39;s second-longest serving non-royal president after Biya. Won a civil war in 1997 to reclaim power. His family controls vast oil revenues from the country&#39;s substantial oilfields. Son Denis Christel Sassou Nguesso serves as Junior Finance Minister — classic dynasty preparation.",
    significantEvents: [
      {
        year: 1979,
        event: "Seized power in military coup — first tenure begins",
        impact: "negative",
      },
      {
        year: 1997,
        event:
          "Won civil war against elected President Lissouba — reclaimed power",
        impact: "negative",
      },
      {
        year: 2015,
        event:
          "Constitutional referendum removed presidential age and term limits",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Won disputed election with 88% — no credible opposition allowed",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Congo&#39;s oil revenues managed through opaque state system benefitting elite",
        impact: "negative",
      },
    ],
    achievements: [
      "Maintained Congo-Brazzaville&#39;s stability relative to DRC neighbour",
      "Oil revenues built Brazzaville&#39;s infrastructure",
      "Managed complex ethnic and regional factions for decades",
      "Congo-Brazzaville avoided the DRC&#39;s spiralling conflict",
    ],
    politicalViews:
      "Originally Marxist-Leninist, now pragmatic resource-nationalist authoritarian. Pro-France (Françafrique), pro-China investment, family capitalism through oil sector. Absolute political control. No opposition tolerated.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Represents the Françafrique system at its most persistent — a French-backed African autocrat whose oil wealth sustains regime survival while his population remains among sub-Saharan Africa&#39;s poorest despite resource wealth.",
    region: "Africa",
  },
  {
    id: "gnassingbe",
    name: "Faure Gnassingbé",
    country: "Togo",
    countryCode: "TG",
    flag: "🇹🇬",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Faure_Gnassingb%C3%A9_2019_%28cropped%29.jpg/440px-Faure_Gnassingb%C3%A9_2019_%28cropped%29.jpg",
    age: 57,
    birthYear: 1966,
    birthPlace: "Afagnan, Togo",
    education: [
      {
        institution: "University of Paris Dauphine",
        degree: "B.A. Economics",
        year: 1990,
      },
      {
        institution: "George Washington University",
        degree: "M.B.A.",
        year: 1994,
      },
    ],
    party: "Rally of the Togolese People (RPT) / UNIR",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2005, to: "present" }],
    background:
      "Son of Gnassingbé Eyadéma — who ruled Togo for 38 years until his death in 2005. The military installed Faure in his father&#39;s place within hours of the elder Gnassingbé&#39;s death, in clear violation of the constitution. Won subsequent elections in votes widely criticised as fraudulent. Has ruled for 20 years, continuing the Gnassingbé family&#39;s total grip on Togo.",
    significantEvents: [
      {
        year: 2005,
        event:
          "Military installed him hours after father&#39;s death — constitutional coup",
        impact: "negative",
      },
      {
        year: 2005,
        event:
          "Post-installment election protests — 40+ killed by security forces",
        impact: "negative",
      },
      {
        year: 2017,
        event: "Mass protests demand constitutional term limits — suppressed",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "New constitution converted Togo to parliamentary system — extended his power",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Appointed President of Council of Ministers under new system — continued rule",
        impact: "negative",
      },
    ],
    achievements: [
      "Regional Mediator — Gnassingbé has brokered multiple Mali and Burkina crises",
      "Lomé Port expansion — West Africa&#39;s deepest port modernised",
      "Togo graduated to lower-middle-income status during his tenure",
      "Maintained Togo outside coup wave that swept Sahel neighbours",
    ],
    politicalViews:
      "Pragmatic authoritarian continuity. Pro-France, now hedging with Russia and China. Regional mediator role used to gain international legitimacy despite domestic repression. Free zone economic model — Lomé as West African logistics hub.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "One of Africa&#39;s clearest examples of dynastic succession — son inheriting a dictatorship built by his father. His constitutional manoeuvres to retain power despite term limits demonstrate the Gnassingbé family&#39;s total institutional control after 57 years combined.",
    region: "Africa",
  },
  {
    id: "boko",
    name: "Duma Boko",
    country: "Botswana",
    countryCode: "BW",
    flag: "🇧🇼",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Duma_Boko_2024_official_portrait.jpg/440px-Duma_Boko_2024_official_portrait.jpg",
    age: 54,
    birthYear: 1969,
    birthPlace: "Mahalapye, Botswana",
    education: [
      {
        institution: "University of Botswana",
        degree: "B.A. Law",
        year: 1993,
      },
      {
        institution: "Harvard Law School",
        degree: "LL.M. (International Law)",
        year: 1995,
      },
    ],
    party: "Umbrella for Democratic Change (UDC)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Harvard-educated lawyer and longtime opposition leader who achieved one of Africa&#39;s most dramatic democratic upsets in October 2024 — ending the Botswana Democratic Party&#39;s unbroken 58-year hold on power since independence. Botswana is held up as Africa&#39;s model democracy and diamond-funded development success story. His victory is a democratic milestone confirming Botswana&#39;s institutions are strong enough to peacefully transfer power.",
    significantEvents: [
      {
        year: 2019,
        event:
          "Led UDC opposition — won significant seats but lost election to Masisi",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Won election in landslide — ending 58 years of BDP rule",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Masisi conceded gracefully — peaceful historic transfer of power",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Diamond revenue challenges — De Beers-Botswana Debswana deal renegotiation",
        impact: "neutral",
      },
    ],
    achievements: [
      "Ended 58-year single-party rule through democratic election",
      "Botswana&#39;s first peaceful inter-party power transfer since independence",
      "Harvard Law credentials bring technocratic credibility to governance",
      "Diamond revenue renegotiation with De Beers prioritised",
    ],
    politicalViews:
      "Liberal democratic, anti-corruption, equity-focused distribution of diamond wealth. Pro-investment climate, rule of law, independent judiciary. Supports diversifying Botswana&#39;s diamond-dependent economy into tech and services.",
    approvalRating: 62,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His election is Africa&#39;s most significant democratic transfer of 2024 — confirming that Botswana&#39;s 58-year-old democratic model can peacefully change governments. A moment of democratic proof in a continent where power transfers are often violent.",
    region: "Africa",
  },
  {
    id: "arevalo",
    name: "Bernardo Arévalo",
    country: "Guatemala",
    countryCode: "GT",
    flag: "🇬🇹",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Bernardo_Ar%C3%A9valo_2023_official_portrait.jpg/440px-Bernardo_Ar%C3%A9valo_2023_official_portrait.jpg",
    age: 65,
    birthYear: 1958,
    birthPlace: "Montevideo, Uruguay (Guatemalan family in exile)",
    education: [
      {
        institution: "University of San Carlos (Guatemala)",
        degree: "B.A. Sociology",
        year: 1983,
      },
      {
        institution: "Utrecht University (Netherlands)",
        degree: "Ph.D. Political Science",
        year: 1998,
      },
    ],
    party: "Semilla (Seed) Movement",
    ideology: "Progressive",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Son of former democratic Guatemalan president Juan José Arévalo, the sociologist-turned-politician ran as the anti-corruption Semilla party candidate. Won the 2023 election in a shocking upset, then faced an extraordinary months-long campaign by the Guatemalan attorney general to prevent his inauguration — seizing ballot boxes, raiding Semilla offices, and attempting to annul the election. International pressure and street protests secured his January 2024 inauguration in what became the most dramatic democratic rescue in recent Latin American history.",
    significantEvents: [
      {
        year: 2023,
        event: "Won presidential election in shock second-round victory",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Attorney general launched extraordinary campaign to block his inauguration",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Inaugurated in January 2024 after massive street protests and US pressure",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Anti-corruption prosecutors and judges finally fired from key positions",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Navigates deeply hostile congress and judiciary inherited from previous system",
        impact: "negative",
      },
    ],
    achievements: [
      "Survived the most sustained attempt to block a democratic inauguration in recent history",
      "Guatemala removed from FATF grey list under his government",
      "Anti-corruption reform commissions established",
      "Son of Guatemala&#39;s most beloved democratic president — democratic legacy restored",
    ],
    politicalViews:
      "Progressive anti-corruption reformist, rule of law, independent judiciary. Pro-social investment, women&#39;s rights, indigenous communities. Western-aligned, pro-US relationship, anti-organised crime in all forms including state corruption.",
    approvalRating: 55,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "His inauguration against all odds is one of the most remarkable democratic moments in 21st century Latin America. Governs a deeply captured state — a congress, judiciary, and prosecutor&#39;s office controlled by corrupt networks — with limited tools but enormous moral authority.",
    region: "Americas",
  },
  {
    id: "ali",
    name: "Irfaan Ali",
    country: "Guyana",
    countryCode: "GY",
    flag: "🇬🇾",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Irfaan_Ali_2020_official_portrait.jpg/440px-Irfaan_Ali_2020_official_portrait.jpg",
    age: 44,
    birthYear: 1980,
    birthPlace: "Leonora, Essequibo Coast, Guyana",
    education: [
      {
        institution: "University of Guyana",
        degree: "B.Sc. Urban and Regional Planning",
        year: 2002,
      },
      {
        institution: "University of the West Indies",
        degree: "M.Sc. Project Management",
        year: 2008,
      },
      {
        institution: "University of Manchester",
        degree: "Ph.D. Planning",
        year: 2014,
      },
    ],
    party: "People&#39;s Progressive Party / Civic (PPP/C)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Former Housing Minister who won the 2020 election after a deeply disputed five-month recount standoff — Granger&#39;s APNU-AFC refused to concede despite clear PPP/C victory in international observers&#39; assessment. Took office in August 2020 just as Guyana was beginning to realise its offshore oil potential — Exxon&#39;s Stabroek Block discovery made Guyana the world&#39;s most oil-rich country per capita almost overnight.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Won disputed election after 5-month standoff — Granger finally conceded",
        impact: "positive",
      },
      {
        year: 2021,
        event:
          "Guyana&#39;s oil production began — Exxon Stabroek Block first barrels",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Guyana overtook Libya as world&#39;s fastest-growing economy — 62% GDP growth",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Venezuela activates Essequibo territorial claim — annexation referendum held",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Guyana&#39;s oil production reaches 700,000+ barrels/day — transformative revenues",
        impact: "positive",
      },
    ],
    achievements: [
      "Managed world&#39;s fastest GDP growth — 62% in 2022",
      "Guyana positioned as one of world&#39;s largest oil producers per capita",
      "Secured ICJ protection against Venezuela&#39;s Essequibo annexation claim",
      "National Development Strategy to diversify oil wealth into education and infrastructure",
    ],
    politicalViews:
      "Centre-left, oil-funded development investment, social inclusion for Indo-Guyanese and Afro-Guyanese communities. Pro-US and Western investment in oil sector. ICJ and international law for Venezuela border defence. Caribbean Community (CARICOM) leadership role.",
    approvalRating: 59,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs the world&#39;s single most dramatic economic transformation story of the 2020s. Guyana&#39;s oil windfall — managed wisely — could make this small Caribbean nation a model of resource-to-development success. Mismanaged, it risks the resource curse that devastated Venezuela next door.",
    region: "Americas",
  },
  // ── BATCH 22: Angola, Mozambique, Pacific, Central Asia + others ──────────
  {
    id: "lourenco",
    name: "João Lourenço",
    country: "Angola",
    countryCode: "AO",
    flag: "🇦🇴",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Jo%C3%A3o_Louren%C3%A7o_2017_%28cropped%29.jpg/440px-Jo%C3%A3o_Louren%C3%A7o_2017_%28cropped%29.jpg",
    age: 70,
    birthYear: 1954,
    birthPlace: "Lobito, Angola",
    education: [
      {
        institution: "U.S.S.R. Frunze Military Academy",
        degree: "Military Studies",
        year: 1983,
      },
      {
        institution: "Agostinho Neto University",
        degree: "B.A. Law",
        year: 1991,
      },
    ],
    party: "People&#39;s Movement for the Liberation of Angola (MPLA)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2017, to: "present" }],
    background:
      "Former Defence Minister who succeeded the 38-year reign of José Eduardo dos Santos in 2017 — and immediately shocked observers by launching a genuine anti-corruption drive against the dos Santos family, including the indictment of Isabel dos Santos (Africa&#39;s former richest woman). Angola is sub-Saharan Africa&#39;s second-largest oil producer with 1.2M+ barrels/day, making Lourenço a pivot figure in Africa&#39;s energy geopolitics.",
    significantEvents: [
      {
        year: 2017,
        event: "Succeeded dos Santos — 38-year era ended; reform mandate began",
        impact: "positive",
      },
      {
        year: 2018,
        event: "Isabel dos Santos and son Filomeno investigated for corruption",
        impact: "positive",
      },
      {
        year: 2020,
        event: "Luanda Leaks — Isabel dos Santos charged; assets frozen",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Won re-election; deepened Western and Chinese investment ties",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Angola suspended from OPEC+ output quota deal over underproduction",
        impact: "negative",
      },
    ],
    achievements: [
      "Launched anti-corruption campaign against the dos Santos dynasty",
      "IMF programme secured — Angola&#39;s economic stabilisation",
      "Lobito Corridor railway deal with EU and US — major infrastructure investment",
      "Angola positioned as key critical minerals (cobalt, lithium) partner for West",
    ],
    politicalViews:
      "Social democratic within MPLA tradition. More technocratic and reformist than predecessor. Pro-Western investment pivot while maintaining China ties. Oil sector transparency improvement. Anti-corruption as signature agenda.",
    approvalRating: 45,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed Angola&#39;s international image from a kleptocratic petro-state into a reforming emerging market. The Lobito Corridor deal with the EU and US marks the most significant Western infrastructure commitment in sub-Saharan Africa in decades — directly competing with China&#39;s BRI.",
    region: "Africa",
  },
  {
    id: "chapo",
    name: "Daniel Chapo",
    country: "Mozambique",
    countryCode: "MZ",
    flag: "🇲🇿",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Daniel_Chapo_2024_official_portrait.jpg/440px-Daniel_Chapo_2024_official_portrait.jpg",
    age: 48,
    birthYear: 1976,
    birthPlace: "Inhambane, Mozambique",
    education: [
      {
        institution: "Eduardo Mondlane University",
        degree: "B.A. Law",
        year: 2001,
      },
      {
        institution: "Eduardo Mondlane University",
        degree: "M.A. Law",
        year: 2008,
      },
    ],
    party: "FRELIMO",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2025, to: "present" }],
    background:
      "Former Governor of Inhambane Province who was elected in the controversial October 2024 presidential election with 70% — results that sparked months of deadly post-election protests that killed 300+ people, led by opposition candidate Venâncio Mondlane&#39;s social media campaign from exile. Was inaugurated in January 2025 amid a country deeply polarised and physically devastated by the unrest. Mozambique holds the world&#39;s largest undeveloped natural gas reserves (offshore Rovuma Basin) — a potential $100B+ investment by TotalEnergies and ExxonMobil.",
    significantEvents: [
      {
        year: 2024,
        event: "Won disputed election with 70%; opposition cried massive fraud",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Post-election protests killed 300+; Mondlane&#39;s social media movement from exile",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Inaugurated as president amid country-wide unrest and infrastructure damage",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "TotalEnergies LNG project restart negotiations — potentially transformative",
        impact: "positive",
      },
    ],
    achievements: [
      "Inaugurated despite sustained opposition and street violence",
      "Gas project engagement — TotalEnergies Mozambique LNG restart discussions",
      "Navigated Inhambane Province governance effectively before presidency",
      "Security forces gradually restoring order — violence declining in 2025",
    ],
    politicalViews:
      "FRELIMO continuity — ruling party that has governed since independence in 1975. Developmentalist, pro-gas investment, pro-Western and Chinese dual engagement. Offers amnesty discussions with opposition. Reformist within FRELIMO tradition.",
    approvalRating: 32,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "Leads Africa&#39;s most consequential new energy frontier — Mozambique&#39;s gas deposits could make it a major LNG exporter within a decade, completely transforming one of the world&#39;s poorest economies. Whether the post-election crisis stabilises will determine if foreign investors return.",
    region: "Africa",
  },
  {
    id: "simina",
    name: "Wesley Simina",
    country: "Micronesia (FSM)",
    countryCode: "FM",
    flag: "🇫🇲",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Wesley_Simina_2023_%28cropped%29.jpg/440px-Wesley_Simina_2023_%28cropped%29.jpg",
    age: 65,
    birthYear: 1959,
    birthPlace: "Chuuk, Federated States of Micronesia",
    education: [
      {
        institution: "University of Guam",
        degree: "B.A. Business Administration",
        year: 1983,
      },
    ],
    party: "Independent",
    ideology: "Centrist",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Former Speaker of the FSM National Congress who was elected President in May 2023, succeeding David Panuelo. Became president at a moment of heightened geopolitical competition for Pacific island influence — immediately after Panuelo&#39;s explosive China letter. Inherited the $7.1B Compact of Free Association with the US and must navigate the China-US rivalry over the 607 islands that make up the FSM.",
    significantEvents: [
      {
        year: 2023,
        event: "Elected President — inherited Panuelo&#39;s anti-China legacy",
        impact: "neutral",
      },
      {
        year: 2023,
        event: "Compact of Free Association with US ratified by US Congress",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Climate finance — FSM advocacy at COP28 and COP29",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Pacific Islands Forum leadership on security and climate",
        impact: "positive",
      },
    ],
    achievements: [
      "Compact of Free Association $7.1B ratification completed",
      "FSM climate vulnerability platform elevated internationally",
      "Maintained US military partnership in Pacific strategic zone",
      "Pacific Islands Forum active engagement",
    ],
    politicalViews:
      "Centrist pragmatist, US alliance-based security, climate action as existential priority — FSM faces sea level rise threat. Pacific sovereignty, anti-nuclear testing legacy. Democratic multilateralism.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs one of the Pacific&#39;s most strategically contested nations — the FSM&#39;s location across critical sea lanes makes it a key piece of the US Indo-Pacific defence framework, directly contested by China&#39;s growing Pacific influence campaign.",
    region: "Asia-Pacific",
  },
  {
    id: "berdymukhamedov",
    name: "Serdar Berdimuhamedow",
    country: "Turkmenistan",
    countryCode: "TM",
    flag: "🇹🇲",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Serdar_Berdimuhamedow_2022_official_portrait.jpg/440px-Serdar_Berdimuhamedow_2022_official_portrait.jpg",
    age: 43,
    birthYear: 1981,
    birthPlace: "Ashgabat, Turkmen SSR (now Turkmenistan)",
    education: [
      {
        institution: "Turkmen State University",
        degree: "B.A. Law",
        year: 2003,
      },
      {
        institution: "Turkmen State University",
        degree: "Ph.D. Law",
        year: 2010,
      },
      {
        institution: "Diplomatic Academy, Moscow",
        degree: "Diplomatic Studies",
        year: 2012,
      },
    ],
    party: "Democratic Party of Turkmenistan",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Son of longtime strongman Gurbanguly Berdimuhamedov — who ruled Turkmenistan from 2006 to 2022 in one of Central Asia&#39;s most eccentric personalised cults — and then engineered an election delivering the presidency to his son while retaining the title of National Leader and chairman of the upper house. The younger Berdimuhamedov is a dynastic transition in perhaps the world&#39;s most hermetically sealed state outside North Korea. Turkmenistan holds the world&#39;s fourth-largest natural gas reserves.",
    significantEvents: [
      {
        year: 2022,
        event: "Elected president at age 40 in father-engineered transition",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Father retained &#39;National Leader&#39; title and upper house chairmanship",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "China gas exports expanded — 85% of gas exports to China via TAPI-alternative",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Trans-Caspian pipeline discussions with EU — diversification attempt",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Turkmenistan officially the world&#39;s largest source of uncontrolled methane emissions",
        impact: "negative",
      },
    ],
    achievements: [
      "Managed Turkmenistan&#39;s gas exports continuity",
      "Trans-Caspian pipeline feasibility discussions with EU opened",
      "Symbolic foreign visits beyond father&#39;s more reclusive style",
      "Maintained Central Asia&#39;s most internally stable (repressed) political environment",
    ],
    politicalViews:
      "Continuation of Berdimuhamedov dynasty authoritarianism. Permanent neutrality status (UN-recognised). Gas resource sovereigntism — almost entirely dependent on China as buyer. No civil society, no free press, no opposition of any kind.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Presides over one of the world&#39;s most complete authoritarian information voids alongside the fourth-largest gas reserves on the planet. Turkmenistan&#39;s methane leaks from its infrastructure have made it one of the largest contributors to global warming per GDP — a crisis acknowledged by no one inside the country.",
    region: "Asia-Pacific",
  },
  {
    id: "pashinyan",
    name: "Nikol Pashinyan",
    country: "Armenia",
    countryCode: "AM",
    flag: "🇦🇲",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Nikol_Pashinyan_2021_official_portrait.jpg/440px-Nikol_Pashinyan_2021_official_portrait.jpg",
    age: 49,
    birthYear: 1975,
    birthPlace: "Idjevan, Armenian SSR (now Armenia)",
    education: [
      {
        institution: "Yerevan State University",
        degree: "B.A. Journalism (incomplete)",
        year: 1998,
      },
    ],
    party: "Civil Contract (Kaghakatsiakan Paymanagir)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2018, to: "present" }],
    background:
      "Journalist turned opposition activist who led the Velvet Revolution in April 2018 — Armenia&#39;s most remarkable peaceful uprising, which removed Serzh Sargsyan after mass street protests in just 11 days without a single death. Became PM on a wave of democratic hope. His tenure was then shattered by the 2020 Nagorno-Karabakh war against Azerbaijan — a humiliating military defeat he survived politically but which fundamentally reshaped his foreign policy away from Russia.",
    significantEvents: [
      {
        year: 2018,
        event:
          "Led Velvet Revolution — ousted Sargsyan in peaceful 11-day uprising",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "44-day war — Armenia lost most of Karabakh to Azerbaijan; near-coup attempt",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Won snap election despite defeat — democratic mandate maintained",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Azerbaijan&#39;s 24-hour op expelled all Armenians from Karabakh",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Armenia formally froze CSTO membership; pivoted toward EU",
        impact: "positive",
      },
    ],
    achievements: [
      "Led Velvet Revolution — most successful peaceful democratic uprising in post-Soviet space",
      "Won democratic mandate twice despite historic military defeat",
      "Armenia pivot from Russia to EU — suspended CSTO membership",
      "Peace treaty negotiations with Azerbaijan — most progress since independence",
    ],
    politicalViews:
      "Liberal democrat, anti-corruption, rule of law. Has dramatically pivoted Armenia away from Russia after CSTO failed to defend Armenia in 2020 and 2023. Pro-EU partnership, pro-US normalisation. Pragmatic on peace treaty with Azerbaijan despite 100,000+ Karabakh refugees.",
    approvalRating: 44,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His pivot away from Russia is the most significant small-state geopolitical reorientation in the post-Soviet space since the Baltic states joined NATO. Armenia&#39;s EU application and CSTO suspension represent a tectonic shift — driven by Russia&#39;s failure to defend its ally.",
    region: "Asia-Pacific",
  },
  {
    id: "meleshanu",
    name: "Mark Brown",
    country: "Cook Islands",
    countryCode: "CK",
    flag: "🇨🇰",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Mark_Brown_Cook_Islands_PM_2020_%28cropped%29.jpg/440px-Mark_Brown_Cook_Islands_PM_2020_%28cropped%29.jpg",
    age: 60,
    birthYear: 1964,
    birthPlace: "Rarotonga, Cook Islands",
    education: [
      {
        institution: "University of Auckland",
        degree: "B.Com. Accounting",
        year: 1988,
      },
    ],
    party: "Cook Islands Party (CIP)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Accountant and former Finance Minister who became Prime Minister of the Cook Islands — a self-governing nation in free association with New Zealand, with 15 tiny islands spread across 2 million km² of Pacific ocean and a population of only 17,000. Became globally significant when his government signed a landmark partnership agreement with China in June 2025 — a deal that blindsided New Zealand and triggered a diplomatic crisis between Wellington and Rarotonga, threatening the free association relationship.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Became Prime Minister — focused on COVID recovery for tourism-dependent nation",
        impact: "neutral",
      },
      {
        year: 2022,
        event:
          "Cook Islands tourism recovered — critical economic lifeline restored",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Seabed mining exploration — Cook Islands EEZ holds manganese nodules",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Signed partnership agreement with China — shocked New Zealand; diplomatic crisis",
        impact: "negative",
      },
    ],
    achievements: [
      "Led Cook Islands through COVID economic recovery",
      "Cook Islands EEZ seabed mineral rights negotiations advanced",
      "Maintained high standard of living for Pacific micro-state",
      "Cook Islands positioned on Pacific geopolitical map through China deal",
    ],
    politicalViews:
      "Cook Islands sovereignty first — resists New Zealand paternalism. Balance between NZ free association and independent foreign policy. Pro-development, climate vulnerable, Pacific Forum engagement. Views China partnership as economic diversification.",
    approvalRating: 48,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "His China deal made the Cook Islands one of the most consequential micro-states in Pacific geopolitics — a 17,000-person nation that triggered a diplomatic crisis between China, New Zealand, and the broader Pacific security architecture in 2025.",
    region: "Asia-Pacific",
  },
  // ── BATCH 23: Pacific, Caribbean, East Africa, C. America ─────────────────
  {
    id: "fiame",
    name: "Fiamē Naomi Mataʻafa (former PM)",
    country: "Samoa",
    countryCode: "WS",
    flag: "🇼🇸",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Fiame_Naomi_Mata%27afa_2021_%28cropped%29.jpg/440px-Fiame_Naomi_Mata%27afa_2021_%28cropped%29.jpg",
    age: 65,
    birthYear: 1957,
    birthPlace: "Samoa",
    education: [
      {
        institution: "Victoria University of Wellington",
        degree: "B.A. Political Science",
        year: 1981,
      },
    ],
    party: "Fa&#39;atuatua i le Atua Samoa ua Tasi (FAST)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Samoa&#39;s first female Prime Minister and daughter of independence leader Fiamē Faumuinā Mulinu&#39;u II. Resigned as deputy PM in 2020 to lead the opposition FAST party, then won the April 2021 election by a single seat in one of the Pacific&#39;s most dramatic constitutional crises — the Supreme Court had to intervene to allow her swearing-in after outgoing PM Tuilagi Sailele Malielegaoi refused to concede for months. A historic Pacific democratic milestone.",
    significantEvents: [
      {
        year: 2021,
        event:
          "Won election by 1 seat — outgoing PM refused to concede for weeks",
        impact: "positive",
      },
      {
        year: 2021,
        event: "Became Samoa&#39;s first female Prime Minister",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Raised Samoa&#39;s China debt concerns; reviewed development agreements",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Lost re-election — HRPP returned to power under outgoing PM&#39;s party",
        impact: "negative",
      },
    ],
    achievements: [
      "First female Prime Minister in Samoa and the Pacific island states",
      "Upheld democratic rule of law — Supreme Court backed her swearing-in",
      "Reviewed Chinese infrastructure debt terms",
      "Pacific leadership on climate vulnerability and Blue Pacific identity",
    ],
    politicalViews:
      "Social democratic, climate-focused, good governance. Sceptical of opaque Chinese debt. Pro-Pacific regional identity and FOSS. Less socially conservative than her predecessor on cultural and gender issues.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "Former",
    impact:
      "Her election and the constitutional crisis it triggered are the most significant democratic test in Pacific island politics in a generation. Lost her re-election bid in 2024.",
    region: "Asia-Pacific",
  },
  {
    id: "marape",
    name: "James Marape",
    country: "Papua New Guinea",
    countryCode: "PG",
    flag: "🇵🇬",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/James_Marape_2019_%28cropped%29.jpg/440px-James_Marape_2019_%28cropped%29.jpg",
    age: 51,
    birthYear: 1973,
    birthPlace: "Tari, Southern Highlands, Papua New Guinea",
    education: [
      {
        institution: "University of Papua New Guinea",
        degree: "B.A. Economics",
        year: 1997,
      },
    ],
    party: "Pangu Party",
    ideology: "Conservative",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Former Finance Minister who became PM in May 2019 after Peter O&#39;Neill resigned amid corruption protests. His signature slogan — &#39;Take Back PNG&#39; — promised resource nationalism and local ownership of PNG&#39;s vast natural gas and mining wealth. PNG is the Pacific&#39;s largest economy and hosts one of the world&#39;s most significant LNG projects (ExxonMobil&#39;s PNG LNG). The country has become a significant US and Australian partners in the Indo-Pacific competition with China.",
    significantEvents: [
      {
        year: 2019,
        event:
          "Became PM after O&#39;Neill resignation over corruption protests",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Won re-election — APEC host year preparations underway",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Signed US Defence Cooperation Agreement — US warships access to PNG",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Enga Province tribal violence killed 50+ — PNG&#39;s worst tribal massacre in decades",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Papua New Guinea LNG expansion negotiations with ExxonMobil and TotalEnergies",
        impact: "positive",
      },
    ],
    achievements: [
      "Signed US Defence Cooperation Agreement — historic security partnership",
      "&#39;Take Back PNG&#39; resource nationalism policies advancing",
      "PNG LNG expansion negotiations — could double production",
      "Maintained PNG&#39;s stability despite tribal conflict outbreaks",
    ],
    politicalViews:
      "Conservative resource nationalist. Pro-Western security alliance amid China&#39;s Pacific push. &#39;Take Back PNG&#39; — greater local ownership of LNG and mining royalties. Balances US/Australian defence ties with Chinese investment in infrastructure.",
    approvalRating: 38,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "PNG under Marape is one of the most consequential Pacific states in US-China competition — its US defence deal and vast resource wealth make it strategically pivotal. Tribal violence and resource governance failures are his defining domestic challenges.",
    region: "Asia-Pacific",
  },
  {
    id: "henry",
    name: "Alix Didier Fils-Aimé",
    country: "Haiti",
    countryCode: "HT",
    flag: "🇭🇹",
    title: "Prime Minister (Acting)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Alix_Didier_Fils-Aim%C3%A9_2024_%28cropped%29.jpg/440px-Alix_Didier_Fils-Aim%C3%A9_2024_%28cropped%29.jpg",
    age: 70,
    birthYear: 1955,
    birthPlace: "Port-au-Prince, Haiti",
    education: [
      {
        institution: "State University of Haiti",
        degree: "B.A. Law",
        year: 1979,
      },
    ],
    party: "Independent / Transitional Council",
    ideology: "Centrist",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Businessman and former trade minister who was appointed PM under Haiti&#39;s Presidential Transitional Council in June 2024, following the resignation of Ariel Henry who had been unable to return to Haiti after gang leader Jimmy Chérizier (&#39;Barbecue&#39;) and the G9 gang coalition seized control of Port-au-Prince airports and key government buildings. Haiti has had no elected president since Jovenel Moïse&#39;s assassination in 2021.",
    significantEvents: [
      {
        year: 2021,
        event:
          "President Moïse assassinated — Haiti enters prolonged governance vacuum",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Gang coalition seizes Port-au-Prince — Ariel Henry unable to return",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Transitional Presidential Council formed — Fils-Aimé appointed PM",
        impact: "neutral",
      },
      {
        year: 2024,
        event: "Kenyan-led MSS security mission begins operations in Haiti",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Gangs still control 80%+ of Port-au-Prince; MSS making limited progress",
        impact: "negative",
      },
    ],
    achievements: [
      "Formed functioning transitional government under extraordinary conditions",
      "Kenyan MSS security mission partnership maintained",
      "Some humanitarian corridors reopened in Port-au-Prince",
      "International aid coordination improved from Henry era",
    ],
    politicalViews:
      "Pragmatic transitional technocrat. No strong ideological position — governance survival is the mission. Pro-international security assistance, anti-gang, pro-election pathway. Heavily dependent on US, Canada, and regional support.",
    approvalRating: null,
    approvalTrend: "down",
    status: "Transitional",
    impact:
      "Governs what the UN describes as the Western Hemisphere&#39;s worst humanitarian crisis — a country where gangs control the capital, 5M+ face acute food insecurity, and there has been no elected president for four years. Haiti&#39;s collapse is a catastrophic failure of international engagement.",
    region: "Americas",
  },
  {
    id: "rowley",
    name: "Keith Rowley",
    country: "Trinidad and Tobago",
    countryCode: "TT",
    flag: "🇹🇹",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Keith_Rowley_2022_%28cropped%29.jpg/440px-Keith_Rowley_2022_%28cropped%29.jpg",
    age: 74,
    birthYear: 1949,
    birthPlace: "Diego Martin, Trinidad and Tobago",
    education: [
      {
        institution: "University of the West Indies, Mona",
        degree: "B.Sc. Geology",
        year: 1974,
      },
      {
        institution: "University of the West Indies, St. Augustine",
        degree: "M.Sc. Petroleum Geoscience",
        year: 1983,
      },
    ],
    party: "People&#39;s National Movement (PNM)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2015, to: "present" }],
    background:
      "Geologist and longtime PNM politician who has led Trinidad and Tobago since 2015. T&T is the Caribbean&#39;s largest energy producer — its LNG exports make it one of the Western Hemisphere&#39;s most important gas suppliers. Rowley navigated a controversial waiver from US sanctions to develop the Venezuela-Trinidad Dragon Gas Field — a deal that highlighted the complex energy geopolitics of the Caribbean basin.",
    significantEvents: [
      {
        year: 2015,
        event:
          "Won election — PNM returned to power after PP government&#39;s economic mismanagement",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "Won re-election despite COVID economic shock to energy revenues",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Secured US sanctions waiver to develop Venezuela&#39;s Dragon gas field",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Dragon Gas Field development progressing — significant new gas supply",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Crime crisis — T&T has one of world&#39;s highest murder rates per capita",
        impact: "negative",
      },
    ],
    achievements: [
      "Dragon Gas Field US sanctions waiver — diplomatic achievement",
      "T&T maintained LNG export position despite energy market volatility",
      "CARICOM chair — Caribbean regional integration leadership",
      "Economic diversification policies for post-energy transition era",
    ],
    politicalViews:
      "Conservative, pro-energy sovereignty, CARICOM regionalist. Pragmatic on Venezuela — energy realism over ideological anti-Maduro position. Pro-US security but demands Caribbean policy respect. Crime reduction through community policing advocate.",
    approvalRating: 34,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Leads the Caribbean&#39;s most energy-significant nation at a pivotal moment — the Dragon Gas Field deal with Venezuelan gas through a US sanctions waiver is one of the most complex energy diplomacy achievements of any Caribbean leader.",
    region: "Americas",
  },
  {
    id: "ngirente",
    name: "Édouard Ngirente",
    country: "Rwanda",
    countryCode: "RW",
    flag: "🇷🇼",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Edouard_Ngirente_2018_%28cropped%29.jpg/440px-Edouard_Ngirente_2018_%28cropped%29.jpg",
    age: 54,
    birthYear: 1970,
    birthPlace: "Kigali, Rwanda",
    education: [
      {
        institution: "National University of Rwanda",
        degree: "B.A. Economics",
        year: 1995,
      },
      {
        institution: "Catholic University of Louvain (UCLouvain)",
        degree: "M.Sc. Economics",
        year: 2000,
      },
    ],
    party: "Rwandan Patriotic Front (RPF)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2017, to: "present" }],
    background:
      "Technocrat and economist who has served as Rwanda&#39;s Prime Minister since 2017 under President Kagame. The PM role in Rwanda is largely administrative — Kagame holds absolute executive authority — but Ngirente manages day-to-day government operations, IMF programme compliance, and coordinates Rwanda&#39;s remarkable economic development ministries. Rwanda&#39;s GDP per capita has grown from $285 in 2000 to over $1,000 in 2024 under RPF governance.",
    significantEvents: [
      {
        year: 2017,
        event: "Appointed PM by Kagame — technocratic appointment",
        impact: "neutral",
      },
      {
        year: 2020,
        event:
          "Managed Rwanda&#39;s COVID-19 response — Africa&#39;s most strict and effective",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Rwanda&#39;s UK asylum deal — outsourced UK migrants to Kigali",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "M23/DRC conflict — Rwanda accused by UN of direct military support",
        impact: "negative",
      },
      {
        year: 2025,
        event: "IMF programme compliance maintained; Vision 2035 advanced",
        impact: "positive",
      },
    ],
    achievements: [
      "Rwanda&#39;s Vision 2050 implementation — economic development roadmap management",
      "COVID-19 response coordination — Africa&#39;s most technologically advanced response",
      "IMF programme compliance for Rwanda&#39;s decade of 7%+ growth",
      "Rwanda&#39;s digital governance — becoming Africa&#39;s tech hub",
    ],
    politicalViews:
      "RPF technocrat — development economics focus within Kagame&#39;s Rwanda Inc framework. Pro-foreign investment, anti-corruption (within RPF system), digital transformation advocate. Represents economic competence layer of Rwanda&#39;s authoritarian-developmental model.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "As the operational manager of Africa&#39;s most cited development success story, Ngirente&#39;s technocratic governance has translated Kagame&#39;s vision into documented economic results — while the DRC conflict casts a long shadow over Rwanda&#39;s international reputation.",
    region: "Africa",
  },
  {
    id: "guelleh",
    name: "Ismail Omar Guelleh",
    country: "Djibouti",
    countryCode: "DJ",
    flag: "🇩🇯",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ismail_Omar_Guelleh_2011_%28cropped%29.jpg/440px-Ismail_Omar_Guelleh_2011_%28cropped%29.jpg",
    age: 77,
    birthYear: 1947,
    birthPlace: "Dire Dawa, Ethiopia (Djiboutian family)",
    education: [
      {
        institution: "Self-educated / French colonial administration training",
        degree: "Administrative Studies",
        year: 1970,
      },
    ],
    party: "People&#39;s Rally for Progress (RPP)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 1999, to: "present" }],
    background:
      "Nephew of independent Djibouti&#39;s founding leader Hassan Gouled Aptidon who became president in 1999. Has ruled for 25+ years in one of the world&#39;s most geopolitically critical small states — Djibouti hosts the only permanent US military base in Africa (Camp Lemonnier), China&#39;s first and only overseas military base, French forces, Japanese forces, and Italian forces. This extraordinary concentration of great power military presence makes Djibouti the Horn of Africa&#39;s indispensable strategic real estate, generating extraordinary rental revenue and diplomatic leverage for a nation of only 1 million people.",
    significantEvents: [
      {
        year: 1999,
        event:
          "Succeeded uncle as President — first peaceful transfer in Djibouti",
        impact: "neutral",
      },
      {
        year: 2017,
        event:
          "China opens first overseas military base at Djibouti — US alarm",
        impact: "neutral",
      },
      {
        year: 2021,
        event: "Re-elected with 97.4% — opposition effectively non-existent",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Djibouti&#39;s port revenues surge — Red Sea conflict drives rerouting",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Ethiopia&#39;s Red Sea access dispute — Djibouti positioned as critical logistics hub",
        impact: "positive",
      },
    ],
    achievements: [
      "Secured Camp Lemonnier — US base lease generating $70M+ annually",
      "China&#39;s first overseas base hosted — maximum geopolitical leverage",
      "Djibouti Port expansion — one of Africa&#39;s most modern logistics hubs",
      "Red Sea conflict 2024–25 made Djibouti the Horn&#39;s busiest alternative port",
    ],
    politicalViews:
      "Authoritarian pragmatist who rents Djibouti&#39;s strategic geography to all comers simultaneously. Pro-revenue maximisation through military base hosting. Non-aligned between great powers by design. Gulf states partnership — Qatar and UAE strategic investment.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed a tiny French colonial outpost into the Horn of Africa&#39;s most strategically indispensable state. The simultaneous presence of US, Chinese, French, and Japanese military bases is unique in modern history — and entirely Guelleh&#39;s achievement in selling Djibouti&#39;s geography to everyone.",
    region: "Africa",
  },
  {
    id: "castro-z",
    name: "Xiomara Castro",
    country: "Honduras",
    countryCode: "HN",
    flag: "🇭🇳",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Xiomara_Castro_official_portrait_2022.jpg/440px-Xiomara_Castro_official_portrait_2022.jpg",
    age: 65,
    birthYear: 1959,
    birthPlace: "Tegucigalpa, Honduras",
    education: [
      {
        institution: "Universidad Nacional Autónoma de Honduras",
        degree: "B.A. Business Administration",
        year: 1985,
      },
    ],
    party: "Libre (Liberty and Refoundation)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Wife of former President Manuel Zelaya who was himself ousted in a 2009 military coup. Won the November 2021 election with 51.1% — the largest margin in Honduran history — becoming the country&#39;s first female president. Her election ended 12 years of the conservative National Party&#39;s rule. Honduras is one of Central America&#39;s most violent and impoverished nations, with one of the world&#39;s highest homicide rates and millions of citizens who have emigrated to the US.",
    significantEvents: [
      {
        year: 2021,
        event: "Won election by largest margin in Honduran history — 51.1%",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Honduras&#39; first female president inaugurated",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Switched diplomatic recognition from Taiwan to China",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Extradited former President Juan Orlando Hernández to US on drug charges",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "State of exception anti-gang crackdown — modelled on El Salvador&#39;s Bukele approach",
        impact: "neutral",
      },
    ],
    achievements: [
      "First female president in Honduran history",
      "Extradited former president Hernández for US drug trafficking trial",
      "Anti-gang state of exception — partial security improvements in some cities",
      "Restored diplomatic relations with Venezuela and Cuba",
    ],
    politicalViews:
      "Left-wing social democratic, feminist, anti-corruption. Switched to China from Taiwan for investment. Critical of US immigration policy on Honduran migrants. Pro-Cuba and Venezuela relations. State of exception anti-gang measures despite civil liberties concerns.",
    approvalRating: 36,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Historic as Central America&#39;s first left-wing female president, but governing one of the hemisphere&#39;s hardest-to-govern states — where gang violence, corruption networks, and emigration pressure define every policy choice.",
    region: "Americas",
  },
  // ── BATCH 24: Libya, South Sudan, Namibia, Eswatini, W.Sahara, Kyrgyzstan, Solomons ──
  {
    id: "dabaiba",
    name: "Abdul Hamid Dabaiba",
    country: "Libya (GNU)",
    countryCode: "LY",
    flag: "🇱🇾",
    title: "Prime Minister, Government of National Unity",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Abdul_Hamid_Dbeibeh_2021_%28cropped%29.jpg/440px-Abdul_Hamid_Dbeibeh_2021_%28cropped%29.jpg",
    age: 65,
    birthYear: 1959,
    birthPlace: "Misrata, Libya",
    education: [
      {
        institution: "University of Waterloo, Canada",
        degree: "B.Eng. Civil Engineering",
        year: 1984,
      },
    ],
    party: "Independent (GNU coalition)",
    ideology: "Centrist",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Construction magnate and former director of a Gaddafi-era infrastructure company who was selected Prime Minister by a UN-backed process in February 2021. Libya has been divided since 2014 — his Government of National Unity controls Tripoli and the west, while a rival government backed by Khalifa Haftar&#39;s LNA controls the east and oil fields. The country remains effectively split, with oil revenues gated by whoever controls the central bank and field pumps.",
    significantEvents: [
      {
        year: 2021,
        event: "Selected PM by Libyan Political Dialogue Forum — UN-backed",
        impact: "positive",
      },
      {
        year: 2021,
        event: "Rival government formed in east — Libya remains split",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Derna floods killed 11,000+ — catastrophic disaster in Haftar-held east",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Oil revenues standoff — eastern government shut fields; $6B/month loss",
        impact: "negative",
      },
      {
        year: 2025,
        event: "Unity government talks stalled; elections perpetually delayed",
        impact: "negative",
      },
    ],
    achievements: [
      "Maintained functioning Western Libya government against rival administration",
      "Distributed $175 cash payment to every Libyan household",
      "Partial infrastructure investment in Tripoli and Misrata",
      "Kept GNU internationally recognised as Libya&#39;s legitimate government",
    ],
    politicalViews:
      "Pragmatic centrist — no strong ideology; transactional politics. Militia patronage model to maintain power in Tripoli. Western-aligned formally but relies on Turkish military backing. Oil revenue distribution as primary governance lever.",
    approvalRating: null,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "Governs half a country — Libya&#39;s persistent split between his Tripoli-based GNU and Haftar&#39;s eastern authority is the defining failure of post-Gaddafi international engagement. Libya&#39;s 48Bbl oil reserves make this dysfunction globally consequential.",
    region: "Africa",
  },
  {
    id: "kiir",
    name: "Salva Kiir Mayardit",
    country: "South Sudan",
    countryCode: "SS",
    flag: "🇸🇸",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Salva_Kiir_Mayardit_2019_%28cropped%29.jpg/440px-Salva_Kiir_Mayardit_2019_%28cropped%29.jpg",
    age: 73,
    birthYear: 1951,
    birthPlace: "Gogrial, South Sudan (then Sudan)",
    education: [
      {
        institution: "Sudan Military Academy",
        degree: "Military Studies",
        year: 1969,
      },
    ],
    party: "Sudan People&#39;s Liberation Movement (SPLM)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2011, to: "present" }],
    background:
      "Commander in the Second Sudanese Civil War who led South Sudan to independence from Sudan in July 2011 — the world&#39;s newest nation, born to jubilation. Three years later plunged that same nation into a catastrophic civil war against his former VP Riek Machar that killed 400,000 people and displaced 4 million. Presides over one of the most oil-rich yet comprehensively failed states on earth — South Sudan&#39;s oil production has collapsed from 350,000 barrels/day to under 130,000.",
    significantEvents: [
      {
        year: 2011,
        event:
          "South Sudan becomes world&#39;s newest independent nation after referendum",
        impact: "positive",
      },
      {
        year: 2013,
        event:
          "Ethnic civil war erupts against Riek Machar&#39;s forces — 400,000 killed",
        impact: "negative",
      },
      {
        year: 2018,
        event: "Revitalised Peace Agreement signed — war formally ended",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Elections repeatedly postponed — Kiir and Machar still sharing power",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Violence resurges in Upper Nile — peace agreement under severe strain",
        impact: "negative",
      },
    ],
    achievements: [
      "Led South Sudan to independence — realised the dream of liberation movement",
      "Revitalised Peace Agreement ended the first phase of civil war",
      "South Sudan maintains nominal statehood despite near-total institutional collapse",
      "Unity government formed with former enemy Riek Machar",
    ],
    politicalViews:
      "Dinka ethnic nationalism, liberation movement politics. Relies on oil revenues distributed to militia commanders as patronage. Deep mistrust of international institutions. Survival politics — coalition-building among armed factions is governance.",
    approvalRating: null,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Transformed South Sudan from the world&#39;s most hopeful new democracy to one of its most complete state failures in just three years. The civil war he triggered resulted in the largest African refugee crisis since the Rwandan genocide.",
    region: "Africa",
  },
  {
    id: "netumbo",
    name: "Netumbo Nandi-Ndaitwah",
    country: "Namibia",
    countryCode: "NA",
    flag: "🇳🇦",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Netumbo_Nandi-Ndaitwah_2024_%28cropped%29.jpg/440px-Netumbo_Nandi-Ndaitwah_2024_%28cropped%29.jpg",
    age: 72,
    birthYear: 1952,
    birthPlace: "Ongandjera, Ovamboland, South West Africa (now Namibia)",
    education: [
      {
        institution: "University of Zambia",
        degree: "B.A. Law",
        year: 1977,
      },
      {
        institution: "University of Sussex",
        degree: "M.A. Development Studies",
        year: 1981,
      },
    ],
    party: "South West Africa People&#39;s Organisation (SWAPO)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2025, to: "present" }],
    background:
      "Liberation movement veteran and former guerrilla fighter who joined SWAPO in exile in the 1970s. Served continuously in government since Namibian independence in 1990 — as minister of information, foreign affairs, environment, and as deputy PM under Hage Geingob. Won the November 2024 presidential election, becoming Africa&#39;s first female head of state elected by popular vote among major democracies — a historic milestone across the continent.",
    significantEvents: [
      {
        year: 1990,
        event:
          "Namibian independence — Nandi-Ndaitwah enters first SWAPO government",
        impact: "positive",
      },
      {
        year: 2015,
        event: "Appointed Deputy PM under Geingob — positioned as successor",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Won presidential election — first woman elected president in Namibia",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Inaugurated — reaffirms green hydrogen investment and resource sovereignty",
        impact: "positive",
      },
    ],
    achievements: [
      "First woman elected president in Namibia and among Africa&#39;s largest democracies",
      "35+ years of continuous government service from independence",
      "Key architect of Namibia&#39;s foreign policy during Geingob era",
      "Namibia&#39;s green hydrogen strategy championed for EU export",
    ],
    politicalViews:
      "Social democratic, pan-African liberation movement tradition. SWAPO party continuity. Resource sovereignty — Namibia&#39;s offshore oil (estimated 11Bbl) and green hydrogen potential. Non-aligned between China investment and Western trade partnerships. Land reform within legal framework.",
    approvalRating: 58,
    approvalTrend: "up",
    status: "In Office",
    impact:
      "Her election is Africa&#39;s most significant democratic female leadership milestone of 2024. Namibia&#39;s vast offshore oil discoveries and green hydrogen potential make her the steward of one of Africa&#39;s most promising emerging energy economies.",
    region: "Africa",
  },
  {
    id: "mswati",
    name: "King Mswati III",
    country: "Eswatini",
    countryCode: "SZ",
    flag: "🇸🇿",
    title: "King of Eswatini",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/King_Mswati_III_2018_%28cropped%29.jpg/440px-King_Mswati_III_2018_%28cropped%29.jpg",
    age: 56,
    birthYear: 1968,
    birthPlace: "Manzini, Swaziland (now Eswatini)",
    education: [
      {
        institution: "Sherborne School, UK",
        degree: "Secondary Education",
        year: 1986,
      },
    ],
    party: "Monarchy (Tinkhundla system)",
    ideology: "Monarchy",
    termsInOffice: [{ from: 1986, to: "present" }],
    background:
      "Became king at age 18 in 1986 — Africa&#39;s last absolute monarch and the world&#39;s last hereditary kingdom without a constitutional parliament. Rules Eswatini (renamed from Swaziland in 2018) with absolute royal decree — political parties are banned, all legislative and executive power vests in the crown. Known for a lavish personal lifestyle with 15 wives and a reported $200M personal fortune while 63% of Eswatinis live on under $2/day.",
    significantEvents: [
      {
        year: 1986,
        event: "Crowned king at 18 after father Sobhuza II&#39;s death",
        impact: "neutral",
      },
      {
        year: 2018,
        event: "Renamed Swaziland to Eswatini — &#39;Land of the Swazis&#39;",
        impact: "neutral",
      },
      {
        year: 2021,
        event: "Pro-democracy protests brutally suppressed — dozens killed",
        impact: "negative",
      },
      {
        year: 2022,
        event: "Political assassinations of pro-democracy lawyers and MPs",
        impact: "negative",
      },
      {
        year: 2023,
        event: "AGOA trade benefits at risk over human rights violations",
        impact: "negative",
      },
    ],
    achievements: [
      "Maintained Eswatini&#39;s sovereignty as Africa&#39;s last absolute monarchy",
      "Limited economic modernisation in urban Mbabane and Manzini",
      "Eswatini retains Taiwan diplomatic recognition — one of Africa&#39;s last",
      "Stability relative to conflict-affected neighbours maintained",
    ],
    politicalViews:
      "Absolute monarchist. Divine right of kingship traditions. All political parties banned. Tinkhundla elected-council system as controlled participation. Taiwan ally — one of only 12 formal Taiwan diplomatic recognition states. Conservative traditional values.",
    approvalRating: null,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Africa&#39;s most complete anachronism — a 21st-century absolute monarch in a country where 63% live in poverty while the royal family&#39;s wealth is conspicuously displayed. His pro-democracy protesters&#39; suppression in 2021 sparked an ongoing low-level resistance movement.",
    region: "Africa",
  },
  {
    id: "japarov",
    name: "Sadyr Japarov",
    country: "Kyrgyzstan",
    countryCode: "KG",
    flag: "🇰🇬",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Sadyr_Japarov_2021_official_portrait.jpg/440px-Sadyr_Japarov_2021_official_portrait.jpg",
    age: 55,
    birthYear: 1968,
    birthPlace: "Kemin, Chuy Region, Kyrgyz SSR (now Kyrgyzstan)",
    education: [
      {
        institution: "Kyrgyz State National University",
        degree: "B.A. History",
        year: 1992,
      },
      {
        institution: "Kyrgyz National Academy of Sciences",
        degree: "Ph.D. History",
        year: 2003,
      },
    ],
    party: "Mekenchil Party",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Nationalist politician who was in prison serving an 11.5-year sentence for hostage-taking when supporters freed him during the October 2020 political uprising that ousted President Sooronbay Jeenbekov. Became acting president within days, then won the January 2021 election with 79% — one of Central Asia&#39;s most improbable political comebacks. Kyrgyzstan is the former Soviet republic that has experienced the most genuine mass democratic uprisings — three revolutions in 15 years.",
    significantEvents: [
      {
        year: 2017,
        event:
          "Jailed for 11.5 years for hostage-taking during a political standoff",
        impact: "negative",
      },
      {
        year: 2020,
        event: "Freed from prison by protesters; became acting president",
        impact: "neutral",
      },
      {
        year: 2021,
        event: "Won presidential election with 79%",
        impact: "positive",
      },
      {
        year: 2022,
        event: "New constitution expanded presidential powers significantly",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Kyrgyzstan-Tajikistan border conflict — clashes killed dozens",
        impact: "negative",
      },
    ],
    achievements: [
      "Unprecedented political comeback from prison to presidency",
      "Gold mining nationalisation — Kumtor gold mine taken back from Canada&#39;s Centerra",
      "New constitution providing strong presidential governance",
      "Kyrgyzstan repositioned as transit corridor for Russia-sanctions-era trade",
    ],
    politicalViews:
      "Kyrgyz nationalist, resource sovereigntist. Took back Kumtor gold mine from Canadian ownership. Russia-aligned security — CSTO member. China investment accepted via BRI. Suspicious of Western democracy promotion NGOs. Populist framing of politics.",
    approvalRating: 62,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His Kumtor mine nationalisation is Central Asia&#39;s most significant resource sovereignty assertion against Western mining capital in decades. Kyrgyzstan&#39;s role as a Russia-sanctions-era re-export corridor has given him unexpected economic leverage.",
    region: "Asia-Pacific",
  },
  {
    id: "sogavare",
    name: "Jeremiah Manele",
    country: "Solomon Islands",
    countryCode: "SB",
    flag: "🇸🇧",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Jeremiah_Manele_2024_%28cropped%29.jpg/440px-Jeremiah_Manele_2024_%28cropped%29.jpg",
    age: 58,
    birthYear: 1966,
    birthPlace: "Malaita Province, Solomon Islands",
    education: [
      {
        institution: "University of the South Pacific",
        degree: "B.A. Diplomacy",
        year: 1991,
      },
    ],
    party: "Our Party",
    ideology: "Centrist",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Former Foreign Minister who replaced Manasseh Sogavare as Prime Minister after the April 2024 elections — though his government represents continuity with Sogavare&#39;s controversial China alignment. Solomon Islands became the center of Pacific geopolitics in 2022 when Sogavare signed a security agreement with China — triggering alarm in Australia, the US, and New Zealand. Manele&#39;s task is to manage those relationships while leveraging Solomon Islands&#39; strategic geography for maximum development return.",
    significantEvents: [
      {
        year: 2019,
        event:
          "Solomon Islands switched diplomatic recognition from Taiwan to China — Manele as FM orchestrated",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Security agreement with China signed — Australia and US alarmed",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Sogavare blocked US request for access to Pacific islands for military",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Manele became PM — China relationship continues; Australia cautiously re-engaged",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Pacific security dialogue — Solomon Islands between Australian and Chinese pressure",
        impact: "neutral",
      },
    ],
    achievements: [
      "Diplomatic transition to China achieved national sovereignty framing",
      "Chinese infrastructure investment secured — roads and government buildings",
      "Pacific Islands Forum engagement maintained despite tension",
      "Australia re-engagement while preserving China relationship",
    ],
    politicalViews:
      "Centrist sovereignty pragmatist — uses China-Australia competition for maximum aid leverage. Non-aligned rhetoric while deeply China-aligned in practice. Resource nationalism — fishing rights and seabed mining potential. Climate vulnerability diplomacy.",
    approvalRating: 42,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Leads one of the Pacific&#39;s most geopolitically significant micro-states — Solomon Islands&#39; China security deal triggered the most serious Pacific security alarm in Washington since the Cold War, directly causing the US to reopen its Honiara embassy and accelerate Pacific engagement.",
    region: "Asia-Pacific",
  },
  // ── BATCH 25: Iraq, Balkans Presidents, West/Central Africa gaps ──────────
  {
    id: "sudani",
    name: "Mohammed Shia' Al-Sudani",
    country: "Iraq",
    countryCode: "IQ",
    flag: "🇮🇶",
    title: "Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Mohammed_Shia%27_Al-Sudani_2022_%28cropped%29.jpg/440px-Mohammed_Shia%27_Al-Sudani_2022_%28cropped%29.jpg",
    age: 53,
    birthYear: 1970,
    birthPlace: "Baghdad, Iraq",
    education: [
      {
        institution: "University of Technology, Baghdad",
        degree: "B.Sc. Computer Engineering",
        year: 1993,
      },
    ],
    party: "State of Law Coalition / Coordination Framework",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "Technocrat and former governor of Maysān Province who became PM in October 2022 after a year-long political deadlock following Iraq&#39;s 2021 elections. His government represents the Iran-aligned Coordination Framework bloc. Navigates the impossible triangle of maintaining cordial US security ties (4,000+ US troops remain in Iraq), satisfying Iran-aligned Popular Mobilisation Units (PMF), and managing Iraq&#39;s enormous oil wealth reconstruction agenda.",
    significantEvents: [
      {
        year: 2022,
        event:
          "Became PM after year-long political deadlock — Sadrists boycotted",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Secured Saudi Arabia–Iraq economic normalisation deal — historic investment",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "US–Iraq negotiations on future of US troops — repositioning framework",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "PMF drones and missiles used against US forces during Gaza war — diplomatic crisis",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Iraq Development Road — $17B infrastructure corridor from Basra to Turkey",
        impact: "positive",
      },
    ],
    achievements: [
      "Iraq-Saudi normalisation — 30-year diplomatic estrangement partially healed",
      "Development Road mega-project — regional connectivity initiative",
      "Iraq&#39;s oil revenues at highest since 2014 — reconstruction investment",
      "Maintained fragile balance between US forces and PMF presence",
    ],
    politicalViews:
      "Pragmatic Iraqi nationalist — neither fully pro-Iran nor pro-US. Seeks Iraq&#39;s strategic autonomy as mediator between Arab states and Iran. Development economics first. Committed to a sovereign Iraqi state that isn&#39;t a battlefield for proxy conflicts.",
    approvalRating: 42,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs the Middle East&#39;s most geopolitically complex major state — an OPEC member with 145Bbl in reserves whose territory hosts simultaneously US forces and Iran-backed militias. His Development Road vision could make Iraq a regional logistics hub if political stability holds.",
    region: "Middle East",
  },
  {
    id: "radev",
    name: "Rumen Radev",
    country: "Bulgaria",
    countryCode: "BG",
    flag: "🇧🇬",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Rumen_Radev_official_portrait_%282022%29.jpg/440px-Rumen_Radev_official_portrait_%282022%29.jpg",
    age: 62,
    birthYear: 1963,
    birthPlace: "Dimitrovgrad, Bulgaria",
    education: [
      {
        institution: "National Military University, Bulgaria",
        degree: "Military Aviation",
        year: 1987,
      },
      {
        institution: "US Air War College",
        degree: "Advanced Military Studies",
        year: 2004,
      },
    ],
    party: "Independent (BSP-backed)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2017, to: "present" }],
    background:
      "Former Commander of the Bulgarian Air Force who won the 2016 presidential election as an independent backed by the Bulgarian Socialist Party — a party with roots in the former communist regime. Bulgaria&#39;s president has limited executive powers but significant veto ability and moral authority. Radev has been a persistent critic of Bulgaria&#39;s GERB-led governments and draws controversy for his sceptical positions on Ukraine sanctions and his relatively Russia-friendly stance — unusual for a NATO member on Russia&#39;s flank.",
    significantEvents: [
      {
        year: 2017,
        event:
          "Won presidential election — first former military chief to serve as president",
        impact: "positive",
      },
      {
        year: 2021,
        event: "Re-elected; Bulgaria&#39;s political instability deepened",
        impact: "neutral",
      },
      {
        year: 2022,
        event:
          "Vetoed legislation multiple times; sceptical of unlimited Ukraine arms",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Bulgaria&#39;s Schengen land border accession — Radev opposed government pace",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Bulgaria Eurozone entry discussions — Radev relatively cautious",
        impact: "neutral",
      },
    ],
    achievements: [
      "Longest-serving Bulgarian president since post-communist democracy",
      "Consistent advocate for anti-corruption governance",
      "Maintained presidential stability through Bulgaria&#39;s 3-year political deadlock",
      "NATO air force credentials gave him credibility on defence issues",
    ],
    politicalViews:
      "Centre-left nationalist, BSP-associated politically. Pro-NATO in alliance obligations but sceptical of escalatory posture toward Russia. Rule of law, anti-corruption. Represents Bulgarian public&#39;s more ambivalent view of Russia compared to Baltic NATO allies.",
    approvalRating: 45,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Bulgaria&#39;s most visible political figure in a period of extraordinary governmental instability. His Russia-scepticism on Ukraine policy makes him an outlier within NATO&#39;s eastern flank presidents — creating tension with PM Zhelyazkov&#39;s more Western-aligned government.",
    region: "Europe",
  },
  {
    id: "pellegrini",
    name: "Peter Pellegrini",
    country: "Slovakia",
    countryCode: "SK",
    flag: "🇸🇰",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Peter_Pellegrini_official_portrait_2024.jpg/440px-Peter_Pellegrini_official_portrait_2024.jpg",
    age: 49,
    birthYear: 1975,
    birthPlace: "Banská Bystrica, Czechoslovakia (now Slovakia)",
    education: [
      {
        institution: "Matej Bel University",
        degree: "B.A. Economics",
        year: 1999,
      },
      {
        institution: "Matej Bel University",
        degree: "M.Sc. Economics",
        year: 2001,
      },
    ],
    party: "Hlas-SD (Voice-Social Democracy)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Former Speaker of the Slovak Parliament and PM (2018–2020) who broke away from Robert Fico&#39;s SMER party to found the centrist Hlas-SD. Won Slovakia&#39;s April 2024 presidential election with 53% — defeating the pro-Fico candidate. The presidency gives him symbolic authority and a potential constitutional check on PM Fico&#39;s controversial pro-Russia governance. His and Fico&#39;s co-existence in the highest two offices creates a complex semi-cohabitational dynamic.",
    significantEvents: [
      {
        year: 2018,
        event:
          "Became PM replacing Fico after journalist Kuciak murder triggered protests",
        impact: "positive",
      },
      {
        year: 2020,
        event: "Lost election to Matovič — left SMER and founded Hlas-SD",
        impact: "neutral",
      },
      {
        year: 2024,
        event:
          "Won presidential election — will coexist with PM Fico in power-sharing",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Navigated Fico assassination attempt — visited Fico in hospital, maintained stability",
        impact: "positive",
      },
    ],
    achievements: [
      "Managed Slovakia as PM during COVID-19 early response",
      "Founded centrist alternative to Fico&#39;s SMER within Slovak left",
      "Won presidential election despite Fico government&#39;s opposition",
      "Maintained institutional stability after assassination attempt crisis",
    ],
    politicalViews:
      "Centre-left social democrat. More pro-EU and Ukraine than PM Fico. Supports NATO obligations. Domestic social policy — healthcare and welfare investment. Institutional democracy defender. Wants cooperation with Fico on economic issues while maintaining EU partnership.",
    approvalRating: 54,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Provides Slovakia&#39;s democratic check on PM Fico&#39;s increasingly Russia-aligned governance. His presidential mandate from a clear majority gives him legitimacy to resist the most extreme aspects of Fico&#39;s foreign policy drift — making the Fico-Pellegrini cohabitation one of Europe&#39;s most watched political relationships.",
    region: "Europe",
  },
  {
    id: "talon",
    name: "Patrice Talon",
    country: "Benin",
    countryCode: "BJ",
    flag: "🇧🇯",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Patrice_Talon_2017_%28cropped%29.jpg/440px-Patrice_Talon_2017_%28cropped%29.jpg",
    age: 66,
    birthYear: 1958,
    birthPlace: "Ouidah, Dahomey (now Benin)",
    education: [
      {
        institution: "University of Paris Dauphine",
        degree: "B.A. Economics",
        year: 1983,
      },
    ],
    party: "Progressive Union for Renewal (UPR) — backed",
    ideology: "Liberal",
    termsInOffice: [{ from: 2016, to: "present" }],
    background:
      "Cotton magnate who became Africa&#39;s most successful private cotton trader before entering politics and winning the 2016 presidential election promising to limit himself to two terms. Governed Benin through a controversial political trajectory — restricting opposition parties through a new electoral code, then winning the 2021 election after key opponents were barred — while achieving genuine economic modernisation and infrastructure development. Benin borders Nigeria and sits at the edge of the Sahel coup wave that has swept its northwestern neighbours.",
    significantEvents: [
      {
        year: 2016,
        event:
          "Won election as businessman-president on anti-corruption platform",
        impact: "positive",
      },
      {
        year: 2019,
        event:
          "New electoral code barred main opposition parties — protests violently dispersed",
        impact: "negative",
      },
      {
        year: 2021,
        event: "Won re-election without opposition — deeply uncompetitive",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Jihadist attacks reached Benin&#39;s north — Sahel insurgency spread",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Cotonou Port expansion completed — West Africa&#39;s most modern container terminal",
        impact: "positive",
      },
    ],
    achievements: [
      "Cotonou Port became West Africa&#39;s leading logistics hub",
      "Benin digital economy — free wifi, digital government, tech investment",
      "GDP growth averaged 6%+ — fastest in West African non-oil economies",
      "Ouidah UNESCO heritage — Voodoo and slave trade history tourism developed",
    ],
    politicalViews:
      "Liberal pro-business, technocratic governance. Foreign investment attraction, port logistics as economic engine. Anti-corruption rhetoric with selective application. France-aligned, ECOWAS committed. Counter-jihadist security investment in north.",
    approvalRating: 48,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs West Africa&#39;s most interesting economic success story — Benin&#39;s logistics and digital economy growth while most neighbours face coups or stagnation. But democratic backsliding has made him a cautionary tale about modernising autocrats.",
    region: "Africa",
  },
  {
    id: "nguema",
    name: "Brice Clotaire Oligui Nguema",
    country: "Gabon",
    countryCode: "GA",
    flag: "🇬🇦",
    title: "President (Transitional)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Brice_Oligui_Nguema_2023_%28cropped%29.jpg/440px-Brice_Oligui_Nguema_2023_%28cropped%29.jpg",
    age: 50,
    birthYear: 1974,
    birthPlace: "Ntoum, Gabon",
    education: [
      {
        institution: "Gabonese Military Academy",
        degree: "Military Studies",
        year: 1996,
      },
      {
        institution: "École de Guerre, France",
        degree: "Advanced Military Studies",
        year: 2007,
      },
    ],
    party:
      "Committee for the Transition and Restoration of Institutions (CTRI)",
    ideology: "Military Junta",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Republican Guard commander and cousin of deposed President Ali Bongo Ondimba who led the August 2023 coup that overthrew the Bongo family&#39;s 56-year dynastic rule — just hours after Ali Bongo was announced as winner of a disputed presidential election. Unlike the Sahel juntas who pivoted to Russia, Oligui Nguema positioned Gabon&#39;s coup as a pro-French, pro-Western correction of a corrupt dynasty rather than an anti-colonialist break. Won a transitional presidential election in April 2025.",
    significantEvents: [
      {
        year: 2023,
        event:
          "Led coup overthrowing 56-year Bongo family dynasty hours after disputed election",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Ali Bongo placed under house arrest — family&#39;s corrupt wealth investigated",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "New constitution drafted — presidential powers revised, transition roadmap set",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Won transitional presidential election with 91% — opposition limited",
        impact: "neutral",
      },
    ],
    achievements: [
      "Ended 56-year Bongo family dynastic rule non-violently",
      "Maintained French economic and military relationships — unlike Sahel juntas",
      "Gabon&#39;s oil revenues investigation — recovering funds from Bongo family",
      "Constitutional transition roadmap established with election timeline",
    ],
    politicalViews:
      "Military reformist — positions junta as democratic restoration rather than Russia-aligned takeover. Pro-France, pro-Western investment. Gabon oil and manganese resource sovereignty. Institutional reform — reducing presidential excess and family enrichment model.",
    approvalRating: 67,
    approvalTrend: "stable",
    status: "Transitional",
    impact:
      "Gabon&#39;s coup represents a different model from the Sahel wave — a correction of a specific dynastic corruption rather than an anti-Western realignment. His maintenance of French ties and Western investment distinguishes Gabon from Mali, Burkina, and Niger&#39;s trajectory.",
    region: "Africa",
  },
  {
    id: "doumbouya",
    name: "Mamadi Doumbouya",
    country: "Guinea",
    countryCode: "GN",
    flag: "🇬🇳",
    title: "President (Transitional)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Mamadi_Doumbouya_2021_%28cropped%29.jpg/440px-Mamadi_Doumbouya_2021_%28cropped%29.jpg",
    age: 40,
    birthYear: 1984,
    birthPlace: "Toumanin, Kankan Region, Guinea",
    education: [
      {
        institution: "French Foreign Legion (training)",
        degree: "Special Forces Training",
        year: 2008,
      },
      {
        institution: "Israeli Special Forces School",
        degree: "Counter-terrorism Studies",
        year: 2012,
      },
    ],
    party: "National Committee of Rally and Development (CNRD)",
    ideology: "Military Junta",
    termsInOffice: [{ from: 2021, to: "present" }],
    background:
      "Former French Foreign Legion officer who returned to Guinea to command the Groupement des Forces Spéciales — Guinea&#39;s special forces. Led the September 2021 coup that overthrew Alpha Condé, who had controversial third-term constitutional changes and been in power for 11 years. At 37, became one of Africa&#39;s youngest leaders. Guinea holds the world&#39;s largest bauxite reserves (65% of global bauxite deposits) and significant gold and iron ore — making it one of Africa&#39;s most resource-consequential transitional states.",
    significantEvents: [
      {
        year: 2021,
        event: "Led coup overthrowing Alpha Condé — arrested former president",
        impact: "neutral",
      },
      {
        year: 2022,
        event:
          "Alliance with Simandou iron ore project partners — $20B investment maintained",
        impact: "positive",
      },
      {
        year: 2023,
        event: "ECOWAS suspended Guinea — transition timeline demands unmet",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Bauxite exports at record — China remains Guinea&#39;s largest buyer",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Simandou iron ore mine — first production from world&#39;s largest iron ore deposit",
        impact: "positive",
      },
    ],
    achievements: [
      "First production from Simandou — world&#39;s largest undeveloped iron ore deposit",
      "Bauxite production maintained — Guinea supplies 65% of global aluminium raw material",
      "Ended Alpha Condé&#39;s 11-year increasingly authoritarian rule",
      "Youth appeal — youngest major African leader championing anti-elite rhetoric",
    ],
    politicalViews:
      "Military nationalist, resource sovereigntist. Balances Chinese investment in minerals with Western diplomatic pressure for democratic transition. Anti-corruption framing. Transition timeline deliberately vague — no rush to elections.",
    approvalRating: 52,
    approvalTrend: "down",
    status: "Transitional",
    impact:
      "Controls the raw material for global aluminium production — 65% of world bauxite. The Simandou iron ore mine beginning production under his watch is potentially the most significant African mining development of the decade. Whether resource wealth translates to governance or perpetuates extraction depends on his transition.",
    region: "Africa",
  },
  {
    id: "sakellaropoulou",
    name: "Katerina Sakellaropoulou",
    country: "Greece",
    countryCode: "GR",
    flag: "🇬🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Katerina_Sakellaropoulou_2020_official_portrait.jpg/440px-Katerina_Sakellaropoulou_2020_official_portrait.jpg",
    age: 69,
    birthYear: 1956,
    birthPlace: "Thessaloniki, Greece",
    education: [
      {
        institution: "University of Athens",
        degree: "B.A. Law",
        year: 1979,
      },
      {
        institution: "University of Paris II",
        degree: "D.E.A. (Advanced Studies) Public Law",
        year: 1981,
      },
      {
        institution: "University of Athens",
        degree: "Ph.D. Law",
        year: 1990,
      },
    ],
    party: "Independent (non-partisan)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Distinguished jurist who served as President of the Greek Council of State — the supreme administrative court — for seven years before being elected President of Greece in January 2020 by a cross-party parliamentary majority including PM Mitsotakis&#39;s New Democracy. Greece&#39;s first female president — elected unanimously in a country still emerging from a decade of austerity. The presidential role is largely ceremonial but carries significant institutional authority.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Became Greece&#39;s first female president — elected with cross-party support",
        impact: "positive",
      },
      {
        year: 2021,
        event:
          "Presided over Greece&#39;s COVID recovery and forest fire crisis response",
        impact: "neutral",
      },
      {
        year: 2022,
        event: "Championed Greek diaspora and cultural diplomacy globally",
        impact: "positive",
      },
      {
        year: 2025,
        event: "Re-elected for second term — continued cross-party support",
        impact: "positive",
      },
    ],
    achievements: [
      "Greece&#39;s first female president — historic constitutional milestone",
      "Unanimous cross-party election — rare in polarised Greek politics",
      "Leading advocate for rule of law and judicial independence in EU",
      "Greek presidential diplomacy in Eastern Mediterranean elevated",
    ],
    politicalViews:
      "Non-partisan jurist. Rule of law absolutist, EU institutional defender, human rights champion. Greece&#39;s constitutional guardian — her legal expertise defining the presidential role. Pro-EU, pro-democratic norms, climate-conscious. Avoids partisan politics by design.",
    approvalRating: 71,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Greece&#39;s highest-approval political figure— a non-partisan jurist whose legal gravitas provides institutional ballast during Greece&#39;s continued post-crisis political turbulence. Her historic first presidency represents a genuine social milestone for a country where political life has been male-dominated.",
    region: "Europe",
  },
  // ── BATCH 26: Palestine, Vatican, Brunei, Imprisoned/Former Leaders ───────
  {
    id: "abbas",
    name: "Mahmoud Abbas",
    country: "Palestinian Authority",
    countryCode: "PS",
    flag: "🇵🇸",
    title: "President, Palestinian Authority",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mahmoud_Abbas_-_2008_%28cropped%29.jpg/440px-Mahmoud_Abbas_-_2008_%28cropped%29.jpg",
    age: 89,
    birthYear: 1935,
    birthPlace: "Safed, British Mandate Palestine (now Israel)",
    education: [
      {
        institution: "University of Damascus",
        degree: "B.A. Law",
        year: 1958,
      },
      {
        institution: "Patrice Lumumba University, Moscow",
        degree: "Ph.D. History",
        year: 1982,
      },
    ],
    party: "Fatah",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2005, to: "present" }],
    background:
      "One of the founding members of Fatah alongside Yasser Arafat, Abbas (also known as Abu Mazen) served as chief negotiator in the Oslo Accords. Became Palestinian Authority President in 2005 after Arafat&#39;s death. His term officially expired in 2009 — he has since governed without a new mandate. The October 7 Hamas attack and subsequent Gaza war forced him into an impossible position as leader of the rival Fatah movement.",
    significantEvents: [
      {
        year: 1993,
        event:
          "Oslo Accords co-negotiator — historic Israeli-Palestinian framework",
        impact: "positive",
      },
      {
        year: 2006,
        event:
          "Hamas won Palestinian legislative elections — PA-Hamas split began",
        impact: "negative",
      },
      {
        year: 2007,
        event: "Hamas seized Gaza — Palestinian national split entrenched",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Oct 7 Hamas attack — Abbas condemned but faced enormous pressure",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "PA announced willingness to govern post-war Gaza — contested legitimacy",
        impact: "neutral",
      },
    ],
    achievements: [
      "Oslo Accords negotiation — historic first Israeli-PLO mutual recognition",
      "PA institutional building — police, courts, civil administration",
      "Won first direct Palestinian presidential election in 2005",
      "International recognition of Palestinian state status advanced at UN",
    ],
    politicalViews:
      "Two-state solution advocate, negotiated settlement over armed resistance. Secular Palestinian nationalism (Fatah tradition). Anti-Hamas politically. Relies on US and EU financial support. Has publicly rejected return to 1948 refugee locations — a major concession from traditional PLO position.",
    approvalRating: 22,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "At 89 and governing with an expired mandate since 2009, Abbas represents the Palestinian leadership vacuum. The Gaza war has made the question of Palestinian governance post-conflict the most important unresolved political question in the Middle East — and Abbas&#39;s PA is the only internationally recognised answer, however contested.",
    region: "Middle East",
  },
  {
    id: "francis",
    name: "Pope Francis (Jorge Bergoglio)",
    country: "Vatican City",
    countryCode: "VA",
    flag: "🇻🇦",
    title: "Pope Emeritus (Deceased April 2025)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Pope_Francis_2021_%28cropped%29.jpg/440px-Pope_Francis_2021_%28cropped%29.jpg",
    age: 88,
    birthYear: 1936,
    birthPlace: "Buenos Aires, Argentina",
    education: [
      {
        institution: "Universidad del Salvador",
        degree: "B.A. Philosophy",
        year: 1960,
      },
      {
        institution: "Colegio Máximo de San José",
        degree: "Licentiate in Theology",
        year: 1970,
      },
    ],
    party: "Holy See (non-political)",
    ideology: "Theocrat",
    termsInOffice: [{ from: 2013, to: "present" }],
    background:
      "Born Jorge Mario Bergoglio in Buenos Aires to Italian immigrant parents. Former Archbishop of Buenos Aires and first Latin American — and first Jesuit — to become Pope. Elected in March 2013 after Benedict XVI&#39;s historic resignation. Known for humility (chose the name Francis after St. Francis of Assisi), reform advocacy within the Church, and a highly political papacy on climate, migration, inequality, and peace.",
    significantEvents: [
      {
        year: 2013,
        event: "Elected Pope — first Latin American, first Jesuit in history",
        impact: "positive",
      },
      {
        year: 2015,
        event:
          "Laudato Si&#39; encyclical — most influential climate document by any religious leader",
        impact: "positive",
      },
      {
        year: 2016,
        event:
          "Met Patriarch Kirill in Cuba — first Catholic-Orthodox papal summit in 1,000 years",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "China-Vatican agreement on bishop appointments renewed — controversial",
        impact: "neutral",
      },
      {
        year: 2025,
        event:
          "Died April 21, 2025 at age 88 — leaving historic reformist legacy",
        impact: "neutral",
      },
    ],
    achievements: [
      "Laudato Si&#39; — defined climate change as moral issue for 1.4B Catholics",
      "Cuba diplomacy — facilitated US-Cuba normalisation under Obama",
      "Sexual abuse reform — Vos Estis Lux Mundi accountability framework",
      "First Latin American pope — shifted Church&#39;s global centre of gravity",
    ],
    politicalViews:
      "Progressive Catholic social teaching. Climate urgency, migrants&#39; rights, economic inequality as moral crises. Pastoral rather than condemnatory in style. Anti-war — consistently called for Ukraine-Russia peace.",
    approvalRating: 64,
    approvalTrend: "stable",
    status: "Former",
    impact:
      "Transformed the papacy&#39;s global political relevance — his encyclicals on climate and inequality became reference documents in international diplomacy. Led the world&#39;s largest religious institution through its most significant reform attempt in a generation.",
    region: "Europe",
  },
  {
    id: "bolkiah",
    name: "Sultan Hassanal Bolkiah",
    country: "Brunei",
    countryCode: "BN",
    flag: "🇧🇳",
    title: "Sultan & Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sultan_of_Brunei_2012_%28cropped%29.jpg/440px-Sultan_of_Brunei_2012_%28cropped%29.jpg",
    age: 78,
    birthYear: 1946,
    birthPlace: "Bandar Seri Begawan, Brunei",
    education: [
      {
        institution: "Royal Military Academy Sandhurst",
        degree: "Officer Training",
        year: 1967,
      },
    ],
    party: "Absolute Monarchy",
    ideology: "Monarchy",
    termsInOffice: [{ from: 1967, to: "present" }],
    background:
      "One of the world&#39;s longest-reigning monarchs and for many years its wealthiest individual. Has ruled Brunei since 1967 — first under British protection, then as fully independent sultan since 1984. Also serves as his own Prime Minister, Finance Minister, and Defence Minister. His personal fortune — estimated at $20B+ — was built on Brunei&#39;s vast offshore oil and gas reserves (production ~100,000 barrels/day). In 2019 implemented sharia criminal law including death by stoning for adultery and same-sex relations — triggering international boycotts.",
    significantEvents: [
      {
        year: 1984,
        event:
          "Brunei gained full independence from UK — Bolkiah becomes absolute ruler",
        impact: "positive",
      },
      {
        year: 1997,
        event:
          "Asian financial crisis — Bolkiah&#39;s brother Jefri&#39;s financial scandal",
        impact: "negative",
      },
      {
        year: 2019,
        event:
          "Sharia penal code implemented — death penalty for gay sex and adultery",
        impact: "negative",
      },
      {
        year: 2020,
        event:
          "International boycott of Brunei hotels — partial enforcement suspension",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Brunei positioned ASEAN 2025 chair — diplomatic rehabilitation attempt",
        impact: "neutral",
      },
    ],
    achievements: [
      "58+ year reign — Asia&#39;s longest-serving monarchic ruler",
      "Brunei citizens pay no income tax — oil wealth distributed as welfare",
      "Universal subsidised healthcare and education from oil revenues",
      "Brunei Darussalam among Asia&#39;s highest per-capita income nations",
    ],
    politicalViews:
      "Malay Islamic Monarchy (MIB) — official state ideology combining Malay cultural identity, Islamic faith, and royal governance. Absolute rule, no political parties permitted. ASEAN diplomatic engagement. Oil dependency creating urgency for economic diversification.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Governs one of the world&#39;s last genuine absolute monarchies with oil wealth that has cushioned citizens from governance concerns. His 2019 sharia law implementation isolated Brunei internationally — but oil money and ASEAN membership insulate him from serious consequences.",
    region: "Asia-Pacific",
  },
  {
    id: "imrankhan",
    name: "Imran Khan",
    country: "Pakistan",
    countryCode: "PK",
    flag: "🇵🇰",
    title: "Former Prime Minister (Imprisoned)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Imran_Khan_2019_%28cropped%29.jpg/440px-Imran_Khan_2019_%28cropped%29.jpg",
    age: 72,
    birthYear: 1952,
    birthPlace: "Lahore, Pakistan",
    education: [
      {
        institution: "Aitchison College, Lahore",
        degree: "Secondary Education",
        year: 1970,
      },
      {
        institution: "Keble College, Oxford",
        degree: "B.A. Philosophy, Politics & Economics",
        year: 1975,
      },
    ],
    party: "Pakistan Tehreek-e-Insaf (PTI)",
    ideology: "Populist",
    termsInOffice: [{ from: 2018, to: 2022 }],
    background:
      "World cricket legend who captained Pakistan to the 1992 World Cup before entering politics. Founded PTI in 1996 and spent 22 years in opposition before winning the 2018 election. Became Pakistan&#39;s 22nd PM, but was ousted via a no-confidence vote in April 2022 in what he calls a US-backed military conspiracy. Since his ouster he has been arrested multiple times, convicted on multiple charges, and imprisoned — while his party continues to be the most popular political movement in Pakistan by polling.",
    significantEvents: [
      {
        year: 1992,
        event:
          "Led Pakistan to Cricket World Cup victory — became national hero",
        impact: "positive",
      },
      {
        year: 2018,
        event: "Won election — years of anti-corruption campaigning paid off",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Ousted via no-confidence vote — claims US-military conspiracy",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Arrested and convicted on multiple charges — PTI mass arrests",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Jailed during election — PTI candidates ran as independents; won most seats",
        impact: "negative",
      },
    ],
    achievements: [
      "1992 Cricket World Cup — Pakistan&#39;s only ODI World Cup victory",
      "Shaukat Khanum Cancer Hospital — world-class facility built through personal fundraising",
      "CPEC leveraged during PM tenure for development gains",
      "PTI remains Pakistan&#39;s most popular party despite full state suppression",
    ],
    politicalViews:
      "Islamic democratic populism, anti-corruption, anti-IMF austerity, independent foreign policy (neither pro-US nor pro-China). Populist welfare state. Opposes Pakistan&#39;s military interference in civilian government. Blames Biden administration and military for his removal.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Jailed but arguably more politically powerful than his successor — PTI won the 2024 election in popular votes if not in allocated seats. His imprisonment has made him a global symbol of civilian vs military political conflict in nuclear-armed Pakistan.",
    region: "Asia-Pacific",
  },
  {
    id: "suu-kyi",
    name: "Aung San Suu Kyi",
    country: "Myanmar",
    countryCode: "MM",
    flag: "🇲🇲",
    title: "Former State Counsellor (Imprisoned)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Aung_San_Suu_Kyi_%282019%29_%28cropped%29.jpg/440px-Aung_San_Suu_Kyi_%282019%29_%28cropped%29.jpg",
    age: 79,
    birthYear: 1945,
    birthPlace: "Rangoon, British Burma (now Yangon, Myanmar)",
    education: [
      {
        institution: "Lady Shri Ram College, University of Delhi",
        degree: "B.A. Political Science",
        year: 1964,
      },
      {
        institution: "St Hugh&#39;s College, Oxford",
        degree: "B.A. Philosophy, Politics & Economics",
        year: 1967,
      },
    ],
    party: "National League for Democracy (NLD)",
    ideology: "Liberal",
    termsInOffice: [{ from: 2016, to: 2021 }],
    background:
      "Daughter of Myanmar&#39;s independence hero General Aung San, she spent 15 of 21 years under house arrest by the military junta for leading the democracy movement. Won the Nobel Peace Prize in 1991. Led the NLD to a landslide election victory in 2015, becoming State Counsellor (de facto prime minister) in 2016 — Myanmar&#39;s first civilian-led government in 50 years. Her international standing was severely damaged by her defence of the military&#39;s Rohingya operations at the ICJ in 2019. Arrested in the February 2021 coup and sentenced to 27 years in prison.",
    significantEvents: [
      {
        year: 1991,
        event: "Nobel Peace Prize — awarded while under house arrest",
        impact: "positive",
      },
      {
        year: 2015,
        event: "NLD wins landslide election — 50 years of military rule broken",
        impact: "positive",
      },
      {
        year: 2019,
        event: "Defended Myanmar at ICJ against Rohingya genocide charges",
        impact: "negative",
      },
      {
        year: 2021,
        event: "Arrested in military coup — sentenced to 27 years in prison",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Reportedly held in solitary confinement — health concerns raised",
        impact: "negative",
      },
    ],
    achievements: [
      "Nobel Peace Prize 1991 — most recognised democracy symbol of her era",
      "Led NLD to 2015 landslide — ended 50 years of military governance",
      "Myanmar&#39;s democratic transition 2016–2021 — however brief",
      "National Reconciliation mandate — worked across ethnic lines",
    ],
    politicalViews:
      "Liberal democratic, Buddhism-influenced. Non-violent resistance as political philosophy. Federal democratic union for Myanmar&#39;s ethnic minorities. Pro-Western partnerships. Her legacy is haunted by Rohingya genocide defence — stripping her of many human rights credentials.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "One of the 20th century&#39;s greatest symbols of peaceful resistance to military tyranny — whose legacy was permanently complicated by the Rohingya genocide and whose imprisonment by the same military she had once worked with shows the tragic limits of democratic-military coexistence.",
    region: "Asia-Pacific",
  },
  {
    id: "karzai",
    name: "Hamid Karzai",
    country: "Afghanistan",
    countryCode: "AF",
    flag: "🇦🇫",
    title: "Former President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Hamid_Karzai_2014_%28cropped%29.jpg/440px-Hamid_Karzai_2014_%28cropped%29.jpg",
    age: 66,
    birthYear: 1957,
    birthPlace: "Kandahar, Afghanistan",
    education: [
      {
        institution: "Himachal Pradesh University, India",
        degree: "B.A. Political Science",
        year: 1981,
      },
      {
        institution: "Himachal Pradesh University, India",
        degree: "M.A. Political Science",
        year: 1983,
      },
    ],
    party: "Independent (Pashtun tribal leader)",
    ideology: "Conservative",
    termsInOffice: [{ from: 2001, to: 2014 }],
    background:
      "Pashtun tribal leader and former mujahideen figure who became Afghanistan&#39;s first post-Taliban president after the US invasion in 2001. Led Afghanistan for 13 years — NATO&#39;s longest nation-building project. Remained in Kabul after the Taliban&#39;s 2021 return — one of the few senior Afghan officials to do so. Has since become a controversial figure meeting Taliban officials and calling for their international engagement, while the Taliban governs Afghanistan as an all-male Islamic emirate.",
    significantEvents: [
      {
        year: 2001,
        event: "Appointed interim leader after US-led Taliban ouster",
        impact: "positive",
      },
      {
        year: 2004,
        event:
          "Elected Afghanistan&#39;s first president in democratic election",
        impact: "positive",
      },
      {
        year: 2014,
        event:
          "Left office after two terms — refused to sign US forces agreement",
        impact: "neutral",
      },
      {
        year: 2021,
        event:
          "Stayed in Kabul as Taliban retook Afghanistan — remarkable decision",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Calls for Taliban international recognition — draws criticism",
        impact: "negative",
      },
    ],
    achievements: [
      "Led Afghanistan&#39;s post-Taliban reconstruction for 13 years",
      "3M refugees returned during his tenure",
      "Girls&#39; education expanded from near-zero to 3M enrolled",
      "Remained in Kabul under Taliban — only major former official to do so",
    ],
    politicalViews:
      "Afghan nationalist, Pashtun tribal conservative. Now advocates pragmatic engagement with Taliban for stability. Blames US withdrawal strategy rather than Taliban for collapse. Believes international isolation of Taliban worsens Afghans&#39; suffering. Seeks neutral status between Taliban and exiled republic.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "The human embodiment of NATO&#39;s $2 trillion, 20-year Afghanistan investment — which collapsed in 11 days in August 2021. His decision to stay in Kabul gives him unique if constrained moral standing in a country now running the world&#39;s most severe anti-female governance experiment.",
    region: "Asia-Pacific",
  },
  {
    id: "sen",
    name: "Hun Sen",
    country: "Cambodia",
    countryCode: "KH",
    flag: "🇰🇭",
    title: "Senate President / Former PM",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Hun_Sen_2018_%28cropped%29.jpg/440px-Hun_Sen_2018_%28cropped%29.jpg",
    age: 72,
    birthYear: 1952,
    birthPlace: "Kampong Cham Province, Cambodia",
    education: [
      {
        institution: "Vietnamese Military Academy",
        degree: "Military Studies",
        year: 1979,
      },
    ],
    party: "Cambodian People&#39;s Party (CPP)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 1985, to: 2023 }],
    background:
      "Former Khmer Rouge military commander who defected to Vietnam and returned to overthrow Pol Pot before becoming the world&#39;s longest-serving prime minister — 38 years. Handed the PM role to his son Hun Manet in 2023 while becoming Senate President — retaining CPP control and the ability to influence governance from a position few dare challenge. One of Southeast Asia&#39;s most consequential authoritarian architects.",
    significantEvents: [
      {
        year: 1979,
        event: "Led Vietnamese-backed force that ended Khmer Rouge genocide",
        impact: "positive",
      },
      {
        year: 1997,
        event:
          "Second coup eliminated FUNCINPEC coalition partner — sole power",
        impact: "negative",
      },
      {
        year: 2017,
        event:
          "Dissolved CNRP opposition party — eliminated all political competition",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Handed PM role to son Hun Manet — orchestrated dynastic succession",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Remains Senate President — de facto power behind son&#39;s government",
        impact: "neutral",
      },
    ],
    achievements: [
      "Ended Khmer Rouge — Cambodia&#39;s most important historical act",
      "Built Cambodia from post-genocide ruins into lower-middle-income nation",
      "38-year PM tenure — world record for non-royal head of government",
      "Cambodia&#39;s infrastructure development — roads, ports, special economic zones",
    ],
    politicalViews:
      "Authoritarian developmentalism, CPP one-party state, deep China alignment. Family capitalism — CPP-linked business empire controls major sectors. No opposition tolerated. Uses &#39;stability&#39; and anti-Khmer Rouge credentials as perpetual legitimacy claims.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Built Cambodia from one of history&#39;s most devastating genocidal destructions into a functioning if authoritarian state. His dynastic transition to Hun Manet is Southeast Asia&#39;s most explicit successor experiment — and the fact that he retains Senate power means Cambodia&#39;s political story is still fundamentally his.",
    region: "Asia-Pacific",
  },
  // ── BATCH 27: Cuba, Oman, Finland former, Vietnam GS, Taiwan former, RSA former, Mexico former ──
  {
    id: "diaz-canel",
    name: "Miguel Díaz-Canel",
    country: "Cuba",
    countryCode: "CU",
    flag: "🇨🇺",
    title: "President & First Secretary, Communist Party",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Miguel_D%C3%ADaz-Canel_Bermúdez_%28cropped%29.jpg/440px-Miguel_D%C3%ADaz-Canel_Bermúdez_%28cropped%29.jpg",
    age: 64,
    birthYear: 1960,
    birthPlace: "Santa Clara, Cuba",
    education: [
      {
        institution: "Central University of Las Villas",
        degree: "B.Sc. Electrical Engineering",
        year: 1982,
      },
    ],
    party: "Communist Party of Cuba (PCC)",
    ideology: "Communist",
    termsInOffice: [{ from: 2018, to: "present" }],
    background:
      "Electrical engineer and career Communist Party official who became the first Cuban president from outside the Castro family in 60 years — succeeding Raúl Castro in 2018. Leads Cuba through its worst economic crisis since the 1990s Special Period, with blackouts lasting 20+ hours, near-total fuel collapse, and the largest wave of emigration in Cuban history — over 1 million Cubans have left since 2020.",
    significantEvents: [
      {
        year: 2018,
        event: "Became president — first non-Castro leader of Cuba since 1959",
        impact: "neutral",
      },
      {
        year: 2021,
        event:
          "July 11 protests — largest anti-government demonstrations in 60 years",
        impact: "negative",
      },
      {
        year: 2022,
        event: "New Family Code passed — same-sex marriage legalised",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Cuba&#39;s electricity grid collapsed — most severe energy crisis since 1990s",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Over 1 million Cubans emigrated — largest exodus in Cuban history",
        impact: "negative",
      },
    ],
    achievements: [
      "Cuba maintained universal healthcare and education through extreme austerity",
      "Same-sex marriage legalisation — Cuba&#39;s most progressive social reform",
      "Maintained Cuban sovereignty despite tightened US embargo",
      "COVID-19 — Cuba developed its own vaccines (Abdala, Soberana)",
    ],
    politicalViews:
      "Marxist-Leninist, anti-US imperialism, third-way socialist economics. Defends revolutionary legacy while acknowledging need for economic reforms. Deeply dependent on Venezuela oil, Russian credits, and remittances. Views emigration as an imperialist aggression consequence rather than governance failure.",
    approvalRating: null,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Governs the Western Hemisphere&#39;s last communist state through a structural crisis that may be more severe than what ended communism in Eastern Europe. Cuba&#39;s mass emigration and blackout crisis under his watch is testing the revolutionary model&#39;s final limits.",
    region: "Americas",
  },
  {
    id: "haitham",
    name: "Sultan Haitham bin Tariq",
    country: "Oman",
    countryCode: "OM",
    flag: "🇴🇲",
    title: "Sultan & Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Haitham_bin_Tariq_Al_Said_%28cropped%29.jpg/440px-Haitham_bin_Tariq_Al_Said_%28cropped%29.jpg",
    age: 68,
    birthYear: 1955,
    birthPlace: "Muscat, Oman",
    education: [
      {
        institution: "University of Oxford",
        degree: "B.A. Politics",
        year: 1979,
      },
    ],
    party: "House of Al Said (Absolute Monarchy)",
    ideology: "Monarchy",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Oxford-educated cousin of the legendary Sultan Qaboos who succeeded after Qaboos died in January 2020 without naming a successor — the Royal Family Council selected Haitham within hours. Oman occupies the most strategically unique position in the Gulf: it maintains open diplomatic channels with Iran, Israel, the US, and Houthi Yemen simultaneously. Omani back-channel diplomacy played a key role in the 2023 Iran–US prisoner swaps and the 2015 secret talks that produced the JCPOA.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Became Sultan after Qaboos&#39; death — smooth succession managed",
        impact: "positive",
      },
      {
        year: 2021,
        event: "Oman Vision 2040 — economic diversification from oil launched",
        impact: "positive",
      },
      {
        year: 2022,
        event: "Muscat hosted Iran–US indirect nuclear talks",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Oman mediated US–Iran prisoner exchange — 5 Americans released",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Oman facilitated Yemen Houthi–Saudi back-channel dialogue",
        impact: "positive",
      },
    ],
    achievements: [
      "Maintained Oman&#39;s unique diplomatic neutrality between Iran, Arab states, and West",
      "Mediated multiple US–Iran prisoner swaps — secret diplomacy role",
      "Oman Vision 2040 economic transformation programme launched",
      "Green hydrogen project — world&#39;s largest planned at HYNO partnership",
    ],
    politicalViews:
      "Absolute monarchist, pragmatic diplomatic neutralist. Oman talks to everyone — US, Iran, Israel, Houthis, Taliban. Believes dialogue over confrontation. Economic liberalisation through Oman Vision 2040. Maintains Qaboos&#39; foreign policy tradition of being the Gulf&#39;s indispensable back channel.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Oman under Haitham continues to punch enormously above its weight in diplomacy — facilitating talks that no other Middle Eastern state can. His country&#39;s simultaneous relationships with Iran and the US make Muscat essential infrastructure for preventing escalation in the world&#39;s most volatile region.",
    region: "Middle East",
  },
  {
    id: "marin",
    name: "Sanna Marin",
    country: "Finland",
    countryCode: "FI",
    flag: "🇫🇮",
    title: "Former Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Sanna_Marin_2020_%28cropped%29.jpg/440px-Sanna_Marin_2020_%28cropped%29.jpg",
    age: 38,
    birthYear: 1985,
    birthPlace: "Helsinki, Finland",
    education: [
      {
        institution: "University of Tampere",
        degree: "M.Sc. Administrative Sciences",
        year: 2012,
      },
    ],
    party: "Social Democratic Party of Finland (SDP)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2019, to: 2023 }],
    background:
      "Became the world&#39;s youngest sitting head of government when appointed PM at 34 in December 2019. Grew up in a single-parent family in a rented council flat — her personal story of social mobility defined her politics. Led Finland through COVID-19 and the historic decision to abandon 200 years of military neutrality and apply for NATO — Finland&#39;s accession to NATO in April 2023 was the most consequential geopolitical decision in Finnish history. Lost the May 2023 election to Orpo&#39;s centre-right coalition.",
    significantEvents: [
      {
        year: 2019,
        event: "Became world&#39;s youngest head of government at 34",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "Led Finland&#39;s COVID response — among Europe&#39;s most effective",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Initiated Finland&#39;s NATO membership application after Russia&#39;s Ukraine invasion",
        impact: "positive",
      },
      {
        year: 2023,
        event: "Finland joined NATO in April — historic end to neutrality",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Lost election to Orpo — left office after leading Finland&#39;s most consequential foreign policy decision",
        impact: "neutral",
      },
    ],
    achievements: [
      "Initiated Finland&#39;s NATO accession — most consequential Finnish foreign policy act since WWII",
      "World&#39;s youngest head of government when appointed",
      "Finland ranked world&#39;s happiest country every year under her tenure",
      "COVID-19 response — Finland had among Europe&#39;s lowest per-capita death tolls",
    ],
    politicalViews:
      "Social democratic, feminist, environmental. Nordic welfare state defender. The Ukraine invasion converted her to a security hawk — she became one of Europe&#39;s most consistent advocates for maximum Ukraine support. Post-PM she has become a global voice for democracy and social democratic values.",
    approvalRating: 58,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Her decision to apply for NATO will be Finland&#39;s most consequential foreign policy act in living memory — permanently transforming the Nordic security architecture. At 38, she remains one of the most globally recognised progressive political figures and a likely future European leader.",
    region: "Europe",
  },
  {
    id: "to-lam",
    name: "Tô Lâm",
    country: "Vietnam",
    countryCode: "VN",
    flag: "🇻🇳",
    title: "General Secretary, Communist Party of Vietnam",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/T%C3%B4_L%C3%A2m_2024_%28cropped%29.jpg/440px-T%C3%B4_L%C3%A2m_2024_%28cropped%29.jpg",
    age: 67,
    birthYear: 1957,
    birthPlace: "Hưng Yên Province, Vietnam",
    education: [
      {
        institution: "People&#39;s Security Academy, Vietnam",
        degree: "Police/Security Studies",
        year: 1982,
      },
      {
        institution: "Academy of People&#39;s Security, Hanoi",
        degree: "Ph.D. Law",
        year: 2006,
      },
    ],
    party: "Communist Party of Vietnam (CPV)",
    ideology: "Communist",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Career security and intelligence official who served as Minister of Public Security (2016–2024) — Vietnam&#39;s domestic intelligence and police apparatus — before rising to become General Secretary of the Communist Party, the most powerful position in Vietnam, in August 2024 following Nguyen Phu Trong&#39;s death. Also briefly served as President. Built his career through Vietnam&#39;s Dot Dieu (Blazing Furnace) anti-corruption campaign which jailed a sitting president, a deputy prime minister, and hundreds of officials.",
    significantEvents: [
      {
        year: 2016,
        event:
          "Became Minister of Public Security — oversaw Dot Dieu anti-corruption drive",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Dot Dieu campaign — jailed President Nguyen Xuan Phuc and senior officials",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Became General Secretary after Nguyen Phu Trong&#39;s death",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Met Xi Jinping and US officials — continuity of bamboo diplomacy",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Vietnam&#39;s semiconductor and AI investment attraction continues",
        impact: "positive",
      },
    ],
    achievements: [
      "Led Vietnam&#39;s most sweeping anti-corruption campaign in party history",
      "Maintained Vietnam&#39;s bamboo diplomacy between US and China",
      "Vietnam&#39;s top security apparatus modernisation during his Ministry tenure",
      "Smooth leadership transition after Trong&#39;s death — party cohesion maintained",
    ],
    politicalViews:
      "Security-state Marxist-Leninist. Continuity of bamboo multi-directional diplomacy. Anti-corruption as regime legitimacy tool. China relations managed carefully — close but sovereignty-assertive. US comprehensive strategic partnership maintained. Vietnam&#39;s economic opening continues.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Vietnam&#39;s most powerful figure arrived via the security apparatus — a different model than economist Trong&#39;s leadership. His anti-corruption campaign eliminated multiple senior officials and signals a harder-edged governance style. How he manages Vietnam&#39;s US–China balance will define Southeast Asian geopolitics for the coming decade.",
    region: "Asia-Pacific",
  },
  {
    id: "tsai",
    name: "Tsai Ing-wen",
    country: "Taiwan",
    countryCode: "TW",
    flag: "🇹🇼",
    title: "Former President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Tsai_Ing-wen_%28cropped%29.jpg/440px-Tsai_Ing-wen_%28cropped%29.jpg",
    age: 68,
    birthYear: 1956,
    birthPlace: "Taipei, Taiwan",
    education: [
      {
        institution: "National Taiwan University",
        degree: "B.A. Law",
        year: 1978,
      },
      {
        institution: "Cornell University",
        degree: "LL.M. Law",
        year: 1980,
      },
      {
        institution: "London School of Economics",
        degree: "Ph.D. Law",
        year: 1984,
      },
    ],
    party: "Democratic Progressive Party (DPP)",
    ideology: "Progressive",
    termsInOffice: [{ from: 2016, to: 2024 }],
    background:
      "LSE-trained trade law academic and former negotiator who became Taiwan&#39;s first female president in 2016 and served two full terms until January 2024. Governed Taiwan through the most dangerous period of cross-strait tensions since the 1996 missile crisis — strengthening Taiwan&#39;s defence, diversifying supply chains, and advancing Taiwan&#39;s international profile while managing Beijing&#39;s military pressure. Never married — first unmarried leader of a major democracy.",
    significantEvents: [
      {
        year: 2016,
        event:
          "Became Taiwan&#39;s first female president — DPP wins historic majority",
        impact: "positive",
      },
      {
        year: 2019,
        event:
          "Rejected &#39;one country two systems&#39; absolutely after Hong Kong crackdown",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "Won re-election with record 8.17M votes — Taiwan&#39;s largest ever mandate",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "China&#39;s largest military exercises around Taiwan after Pelosi visit",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Left office peacefully — DPP wins historic third straight presidential election",
        impact: "positive",
      },
    ],
    achievements: [
      "Taiwan&#39;s COVID-19 response cited globally as model — near-zero early deaths despite proximity to China",
      "Taiwan&#39;s defence spending raised — extended military service mandatory",
      "TSMC global expansion — Taiwan cemented as world&#39;s chip manufacturing hub",
      "Taiwan&#39;s first female president — two full terms of democratic governance",
    ],
    politicalViews:
      "Progressive democratic, pro-Taiwan identity, opposed to &#39;one country two systems&#39;. Security hawk who dramatically raised defence capabilities. Pro-US alliance, pro-Japan partnership. Semiconductor sovereignty — positioned TSMC as Taiwan&#39;s &#39;silicon shield&#39;. Pragmatic on cross-strait trade while hardening military deterrence.",
    approvalRating: 64,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Led Taiwan through its most dangerous eight years since 1996 while building the democratic identity and defence posture that has made Taiwan a credible self-defending democracy. Her semiconductor strategy transformed Taiwan&#39;s geopolitical leverage from vulnerability to indispensability.",
    region: "Asia-Pacific",
  },
  {
    id: "zuma",
    name: "Jacob Zuma",
    country: "South Africa",
    countryCode: "ZA",
    flag: "🇿🇦",
    title: "Former President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Jacob_Zuma_2010_%28cropped%29.jpg/440px-Jacob_Zuma_2010_%28cropped%29.jpg",
    age: 83,
    birthYear: 1942,
    birthPlace: "Nkandla, Zululand, South Africa",
    education: [
      {
        institution: "Self-educated (imprisoned on Robben Island)",
        degree: "No formal qualifications",
        year: 1973,
      },
    ],
    party: "uMkhonto we Sizwe (MK) Party — formerly ANC",
    ideology: "Populist",
    termsInOffice: [{ from: 2009, to: 2018 }],
    background:
      "ANC intelligence chief, Robben Island prisoner, and liberation movement veteran who became South Africa&#39;s most controversial president. His nine years (2009–2018) are defined by &#39;state capture&#39; — the systematic hollowing out of state institutions in partnership with the Gupta family, at an estimated cost of $34B to the South African economy. Removed by the ANC in 2018, jailed briefly in 2021 on contempt charges triggering the KZN riots, he then formed a new party (MK) and in 2024 won 14.6% in national elections — threatening ANC dominance in KwaZulu-Natal.",
    significantEvents: [
      {
        year: 2009,
        event:
          "Became President despite 783 corruption charges — later dropped",
        impact: "negative",
      },
      {
        year: 2016,
        event:
          "Nkandla scandal — Constitutional Court found he violated his oath",
        impact: "negative",
      },
      {
        year: 2018,
        event:
          "Forced to resign by ANC after Ramaphosa&#39;s election as party leader",
        impact: "neutral",
      },
      {
        year: 2021,
        event: "Jailed for contempt of court — KZN riots killed 300+",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "MK party wins 14.6% — disrupts ANC&#39;s KwaZulu-Natal dominance",
        impact: "negative",
      },
    ],
    achievements: [
      "South Africa expanded social grants under his tenure — 17M+ recipients",
      "National Health Insurance concept initiated",
      "BRICS membership consolidated under his government",
      "Led ANC&#39;s electoral victories in 2009 and 2014",
    ],
    politicalViews:
      "Zulu ethnic populism, ANC liberation movement traditionalism. Used state resources for personal and factional enrichment. Anti-establishment rhetoric despite being establishment. MK party frames ANC leadership as &#39;betrayers&#39; of liberation legacy. Populist redistribution rhetoric with kleptocratic practice.",
    approvalRating: 22,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "State capture under Zuma represents the largest self-inflicted economic damage by any African democracy — $34B stolen or wasted, Eskom collapsed, and institutions gutted. His MK party&#39;s 2024 resurgence shows the durability of ethnic-populist politics even after comprehensive governance failure.",
    region: "Africa",
  },
  {
    id: "amlo",
    name: "Andrés Manuel López Obrador",
    country: "Mexico",
    countryCode: "MX",
    flag: "🇲🇽",
    title: "Former President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Andr%C3%A9s_Manuel_L%C3%B3pez_Obrador_2018_%28cropped%29.jpg/440px-Andr%C3%A9s_Manuel_L%C3%B3pez_Obrador_2018_%28cropped%29.jpg",
    age: 71,
    birthYear: 1953,
    birthPlace: "Tepetitán, Tabasco, Mexico",
    education: [
      {
        institution: "National Autonomous University of Mexico (UNAM)",
        degree: "B.A. Political Science",
        year: 1987,
      },
    ],
    party: "MORENA (National Regeneration Movement)",
    ideology: "Populist",
    termsInOffice: [{ from: 2018, to: 2024 }],
    background:
      "Known as AMLO, he ran for president three times before finally winning in 2018 with a historic 53% majority — Mexico&#39;s largest ever at that time. Founded MORENA as a new political movement after leaving the PRD, reshaping Mexican politics from a triparty system to MORENA dominance. His &#39;Fourth Transformation&#39; (4T) promised to end corruption and restore Mexican sovereignty. Handed power to his chosen successor Claudia Sheinbaum in October 2024.",
    significantEvents: [
      {
        year: 2018,
        event:
          "Won election with 53% — Mexico&#39;s most decisive presidential victory",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "Refused to acknowledge COVID as major emergency — downplayed throughout",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Returned national guard to states — armed forces in streets nationwide",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Judicial reform passed — 2,500+ judges subject to public election",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Left office with 60%+ approval — Sheinbaum won with record 59%",
        impact: "positive",
      },
    ],
    achievements: [
      "Doubled minimum wage during his tenure — real income gains for poorest workers",
      "Sembrando Vida and Jóvenes Construyendo el Futuro — rural and youth social programmes",
      "Energy sovereignty — Pemex and CFE nationalisation reinforced",
      "Cancelled NAICM airport — $13B project stopped to challenge corrupt establishment",
    ],
    politicalViews:
      "Mexican nationalist populism, anti-neoliberalism, fourth transformation ideology. Energy sovereigntist — state oil and electricity companies non-negotiable. Non-interventionist foreign policy (&#39;best foreign policy is good domestic policy&#39;). Deep distrust of US supervision of Mexico&#39;s internal affairs. Evangelical Christian values despite leftist economics.",
    approvalRating: 62,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Reshaped Mexican politics permanently — MORENA now dominates all three branches of government under Sheinbaum. His judicial reform may prove his most consequential and most contested legacy, potentially undermining independent courts for decades. The progressive versus authoritarian debate about his six years remains Mexico&#39;s defining political argument.",
    region: "Americas",
  },
  // ── BATCH 28: UK Monarchy, Iconic Formers, International Institutions ────
  {
    id: "charles3",
    name: "King Charles III",
    country: "United Kingdom",
    countryCode: "GB",
    flag: "🇬🇧",
    title: "King of the United Kingdom & 14 Realms",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/King_Charles_III_official_portrait_2023.jpg/440px-King_Charles_III_official_portrait_2023.jpg",
    age: 76,
    birthYear: 1948,
    birthPlace: "Buckingham Palace, London, UK",
    education: [
      {
        institution: "Gordonstoun School",
        degree: "Secondary Education (A-levels)",
        year: 1967,
      },
      {
        institution: "Trinity College, Cambridge",
        degree: "B.A. Archaeology, Anthropology & History",
        year: 1970,
      },
    ],
    party: "The Crown (non-political)",
    ideology: "Monarchy",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "The longest-serving Prince of Wales in history — waiting 70 years to become King upon the death of Queen Elizabeth II in September 2022. An organic farming pioneer, architectural critic, and climate activist long before these were mainstream political positions. Married Diana Spencer in 1981 (died 1997), then Camilla Parker Bowles in 2005. His coronation in May 2023 was the first in 70 years.",
    significantEvents: [
      {
        year: 1981,
        event:
          "Married Princess Diana — 'the wedding of the century' watched by 750M globally",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Became King on death of Queen Elizabeth II — after 70 years as heir apparent",
        impact: "neutral",
      },
      {
        year: 2023,
        event:
          "Coronation at Westminster Abbey — first in 70 years attended by 100+ world leaders",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Diagnosed with cancer — publicly disclosed; continued duties during treatment",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Commonwealth heads of government engagement; Canada sovereignty crisis diplomacy",
        impact: "positive",
      },
    ],
    achievements: [
      "The Prince's Trust — created 1976, helped 1M+ young people into work",
      "Duchy of Cornwall and Organic farming model estate — environmental pioneer",
      "Architectural campaigner — saved many historic UK buildings from demolition",
      "Climate advocacy — championed net zero decades before mainstream political consensus",
    ],
    politicalViews:
      "Constitutional monarch — non-political by constitutional requirement. Personally deeply committed to environmental conservation, organic farming, interfaith dialogue, and youth opportunity. Climate change activist before becoming King — the UK and global Commonwealth&#39;s ceremonial head.",
    approvalRating: 42,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Inherited the most globally recognised monarchy at its most tested moment — navigating cancer, Prince Harry&#39;s departure, and Commonwealth questioning of the Crown&#39;s relevance while bringing genuine personal passion for climate and youth development to the role.",
    region: "Europe",
  },
  {
    id: "ardern",
    name: "Jacinda Ardern",
    country: "New Zealand",
    countryCode: "NZ",
    flag: "🇳🇿",
    title: "Former Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Jacinda_Ardern_%282018%29_%28cropped%29.jpg/440px-Jacinda_Ardern_%282018%29_%28cropped%29.jpg",
    age: 44,
    birthYear: 1980,
    birthPlace: "Hamilton, Waikato, New Zealand",
    education: [
      {
        institution: "University of Waikato",
        degree: "B.Com. (Communication Studies & Political Science)",
        year: 2001,
      },
    ],
    party: "New Zealand Labour Party",
    ideology: "Progressive",
    termsInOffice: [{ from: 2017, to: 2023 }],
    background:
      "Became New Zealand&#39;s youngest-ever PM at 37 and the world&#39;s second elected leader to give birth while in office. Transformed the international image of political leadership through her responses to the 2019 Christchurch mosque shootings (banned assault weapons within days) and COVID-19 (elimination strategy). Resigned in January 2023, stating she no longer had &#39;enough in the tank&#39; — a globally discussed act of political self-awareness.",
    significantEvents: [
      {
        year: 2017,
        event: "Won election at 37 — youngest NZ PM in history",
        impact: "positive",
      },
      {
        year: 2018,
        event:
          "Gave birth to daughter Neve while PM — second elected leader in history to do so",
        impact: "positive",
      },
      {
        year: 2019,
        event:
          "Christchurch mosque shootings — banned assault weapons within days; globally praised response",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "COVID-19 elimination strategy — NZ among world&#39;s most successful responses initially",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Resigned citing emotional exhaustion — 'I no longer have enough in the tank'",
        impact: "neutral",
      },
    ],
    achievements: [
      "Fastest-ever gun reform legislation in a democracy — assault weapons banned in days",
      "Christchurch Call — global social media extremism agreement with France",
      "NZ&#39;s COVID-19 elimination strategy — 100 days with no community transmission",
      "Wellbeing Budget — first national budget prioritising mental health and child poverty",
    ],
    politicalViews:
      "Progressive social democrat, feminist, compassionate governance advocate. Climate action, child poverty reduction, mental health investment. Internationally championed a new model of empathetic political leadership. Post-PM: Harvard Kennedy School fellowship and global democracy advocacy.",
    approvalRating: 72,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Redefined what political leadership could look like — proving empathy, directness, and humanity are political assets rather than weaknesses. Her resignation was as consequential as her tenure — modelling that acknowledging human limits is not weakness. One of the most globally recognised political figures of the 2020s.",
    region: "Asia-Pacific",
  },
  {
    id: "borisjohnson",
    name: "Boris Johnson",
    country: "United Kingdom",
    countryCode: "GB",
    flag: "🇬🇧",
    title: "Former Prime Minister",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Boris_Johnson_official_portrait_%28cropped%29.jpg/440px-Boris_Johnson_official_portrait_%28cropped%29.jpg",
    age: 60,
    birthYear: 1964,
    birthPlace: "Upper East Side, New York City, USA",
    education: [
      {
        institution: "Eton College",
        degree: "Secondary Education",
        year: 1983,
      },
      {
        institution: "Balliol College, Oxford",
        degree: "B.A. Classics",
        year: 1987,
      },
    ],
    party: "Conservative Party",
    ideology: "Conservative",
    termsInOffice: [{ from: 2019, to: 2022 }],
    background:
      "Former journalist, Mayor of London (2008–2016), and Foreign Secretary who became the face of the 2016 Brexit Leave campaign. Won a historic 80-seat Conservative majority in December 2019 on the slogan 'Get Brexit Done'. His tenure delivered Brexit but was consumed by COVID-19, Partygate lockdown-rule violations, and a parliamentary vote of no confidence that ended his career in July 2022.",
    significantEvents: [
      {
        year: 2016,
        event:
          "Led the successful Brexit Leave campaign — defining political moment",
        impact: "neutral",
      },
      {
        year: 2019,
        event:
          "Won 80-seat election majority — largest Conservative victory since Thatcher",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "UK–EU Trade and Cooperation Agreement completed — Brexit trade deal",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "COVID-19 — MHRA approved world&#39;s first COVID vaccine (Oxford/AstraZeneca) in UK",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Partygate — fined by police for lockdown violation; lost confidence vote; resigned",
        impact: "negative",
      },
    ],
    achievements: [
      "Delivered Brexit — UK left EU single market and customs union after 47 years",
      "Operation Moonshot/Vaccine programme — UK among world&#39;s fastest vaccine rollouts",
      "Australia and New Zealand FTAs — first post-Brexit independent trade deals",
      "£37B 'levelling up' agenda for left-behind UK communities",
    ],
    politicalViews:
      "One-nation Conservative, Eurosceptic, pro-free trade globally. Socially liberal by Conservative standards. Big state spender despite fiscal rhetoric. Popularist — pivoted Conservatives toward working-class northern England seats. Pro-Ukraine: one of Zelensky&#39;s earliest and most vocal Western supporters.",
    approvalRating: 23,
    approvalTrend: "down",
    status: "In Office",
    impact:
      "Delivered the most consequential policy change in British post-war history (Brexit) while proving the sustainability of populist politics within a Conservative framework. Partygate confirmed that even landslide mandates can&#39;t survive systematic hypocrisy on the rules leaders themselves set.",
    region: "Europe",
  },
  {
    id: "jokowi",
    name: "Joko Widodo",
    country: "Indonesia",
    countryCode: "ID",
    flag: "🇮🇩",
    title: "Former President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Joko_Widodo_2019_%28cropped%29.jpg/440px-Joko_Widodo_2019_%28cropped%29.jpg",
    age: 63,
    birthYear: 1961,
    birthPlace: "Surakarta (Solo), Central Java, Indonesia",
    education: [
      {
        institution: "Gadjah Mada University",
        degree: "B.Sc. Forestry",
        year: 1985,
      },
    ],
    party: "Indonesian Democratic Party of Struggle (PDI-P)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2014, to: 2024 }],
    background:
      "Furniture maker and businessman who became Mayor of Solo, then Governor of Jakarta, before winning the 2014 presidential election — the first Indonesian president without a military or political elite background. Known universally as &#39;Jokowi&#39;, he served two terms transforming Indonesia&#39;s infrastructure, moving the capital from Jakarta to the new city of Nusantara in Borneo (the world&#39;s only planned capital relocation still in progress), and overseeing Indonesia&#39;s emergence as a G20 major player. Chose Prabowo as his successor.",
    significantEvents: [
      {
        year: 2014,
        event:
          "Won presidential election — first commoner and non-elite president",
        impact: "positive",
      },
      {
        year: 2019,
        event:
          "Re-elected with 55% — defeated Prabowo for second consecutive time",
        impact: "positive",
      },
      {
        year: 2019,
        event:
          "Announced relocation of capital from Jakarta to Nusantara, East Borneo",
        impact: "neutral",
      },
      {
        year: 2022,
        event:
          "G20 host in Bali — managed Russia-Ukraine war diplomacy at summit",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Left office with 75%+ approval — highest exit approval of any Indonesian president",
        impact: "positive",
      },
    ],
    achievements: [
      "18,000km of roads, 1,900 bridges, 10 airports, 5 ports built during his decade",
      "Universal healthcare (JKN) expanded to 250M+ Indonesians",
      "Nusantara — world&#39;s largest planned capital city relocation initiated",
      "Indonesia&#39;s nickel and EV battery industrialisation strategy — raw materials ban drove processing investment",
    ],
    politicalViews:
      "Pragmatic nationalist, development economics first. Infrastructure over bureaucracy. Non-aligned between US and China — both get investment. Anti-corruption rhetoric with selective enforcement. Nickel sovereigntism — banned raw ore exports to force downstream industrialisation.",
    approvalRating: 76,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed Indonesian governance from a revolving door of Jakarta elites to a genuine outsider presidency focused on infrastructure and development. His nickel export ban triggered the world&#39;s most consequential commodity sovereignty move by any developing country — forcing EV supply chain investment into Indonesia.",
    region: "Asia-Pacific",
  },
  {
    id: "obiang",
    name: "Teodoro Obiang Nguema Mbasogo",
    country: "Equatorial Guinea",
    countryCode: "GQ",
    flag: "🇬🇶",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Teodoro_Obiang_Nguema_Mbasogo_%28cropped%29.jpg/440px-Teodoro_Obiang_Nguema_Mbasogo_%28cropped%29.jpg",
    age: 82,
    birthYear: 1942,
    birthPlace: "Acoacán, Río Muni, Spanish Guinea (now Equatorial Guinea)",
    education: [
      {
        institution: "Military Academy Zaragoza, Spain",
        degree: "Military Studies",
        year: 1963,
      },
    ],
    party: "Democratic Party of Equatorial Guinea (PDGE)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 1979, to: "present" }],
    background:
      "Has ruled Equatorial Guinea since August 1979 — when he overthrew and executed his own uncle Francisco Macías Nguema — making him the world&#39;s longest-serving non-royal president at 46 years. Presides over one of Africa&#39;s most grotesque resource curse stories: Equatorial Guinea has the highest GDP per capita in sub-Saharan Africa ($7,000+) from its offshore oil, yet most of its 1.5M citizens live in poverty while the Obiang/Nguema family controls the nation&#39;s wealth. His son Teodorin serves as Vice President and is facing corruption investigations in Spain and France.",
    significantEvents: [
      {
        year: 1979,
        event: "Overthrew and executed uncle Macías Nguema — became president",
        impact: "neutral",
      },
      {
        year: 1995,
        event:
          "Offshore oil discovery — EG transforms into sub-Saharan Africa&#39;s highest GDP per capita",
        impact: "positive",
      },
      {
        year: 2004,
        event: "Coup attempt linked to Mark Thatcher and Simon Mann — survived",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Won election with 94.9% — son Teodorin positioned as successor",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "46th year in power — world&#39;s longest-serving non-royal leader",
        impact: "negative",
      },
    ],
    achievements: [
      "46 years in power — world record for non-royal heads of state",
      "Maintained country&#39;s formal statehood and sovereignty",
      "Equatorial Guinea&#39;s oil revenues built Malabo and Bata infrastructure",
      "African Union and ECCAS membership maintained",
    ],
    politicalViews:
      "Personal authoritarian dynasty. No political opposition tolerated. Oil revenues controlled by ruling family. Son Teodorin&#39;s corruption cases in Western courts represent the global rule-of-law challenge the regime embodies. Anti-Western democratic pressure.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "The world&#39;s most extreme case of oil-funded personal autocracy — higher GDP per capita than most African nations, yet one of the world&#39;s highest infant mortality rates. His 46-year rule is the definitive case study in resource curse governance failure.",
    region: "Africa",
  },
  // ── BATCH 29 — FINAL: Tunisia, Poland Pres, Niger, UAE-Dubai, Liberia, Bolivia, Vatican ──
  {
    id: "saied",
    name: "Kaïs Saïed",
    country: "Tunisia",
    countryCode: "TN",
    flag: "🇹🇳",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Kais_Saied_2021_%28cropped%29.jpg/440px-Kais_Saied_2021_%28cropped%29.jpg",
    age: 66,
    birthYear: 1958,
    birthPlace: "Tunis, Tunisia",
    education: [
      { institution: "University of Tunis", degree: "B.A. Law", year: 1983 },
      {
        institution: "University of Tunis El Manar",
        degree: "Ph.D. Public Law",
        year: 1988,
      },
    ],
    party: "Independent (no party)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Constitutional law professor who won Tunisia&#39;s 2019 presidential election with 73% — hailed as the Arab world&#39;s democratic breakthrough. In July 2021, suspended parliament, dismissed the government, and assumed emergency rule by decree — a self-coup widely condemned as the reversal of Tunisia&#39;s Arab Spring democracy. Pushed through a new constitution in 2022 concentrating all power in the presidency. The IMF and Western donors suspended support over governance concerns.",
    significantEvents: [
      {
        year: 2019,
        event: "Won election with 73% — celebrated as anti-corruption outsider",
        impact: "positive",
      },
      {
        year: 2021,
        event:
          "Suspended parliament and dismissed PM — self-coup triggered international alarm",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "New constitution approved — presidential powers absolute, parliament weakened",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Mass arrests of opposition, journalists, and civil society leaders",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Won re-election with 90% in vote boycotted by opposition — IMF deal stalled",
        impact: "negative",
      },
    ],
    achievements: [
      "Won Tunisia&#39;s freest presidential election in 2019 — genuine democratic mandate",
      "Arrested prominent businessmen linked to Ben Ali and Ennahda corruption",
      "Tunisia&#39;s migration agreement with EU — €105M suppression-of-crossings deal",
      "Maintained Tunisian stability vs Libya-style collapse alternative",
    ],
    politicalViews:
      "Populist authoritarian constitutionalist. Frames democracy as &#39;popular legitimacy&#39; not institutionalism. Anti-Islamist, anti-liberal-democratic party system. Resource nationalist. Suspicious of Western NGOs and international financial conditions.",
    approvalRating: 35,
    approvalTrend: "down",
    status: "Incumbent (Disputed)",
    impact:
      "Reversed the Arab Spring&#39;s most consequential democratic experiment — Tunisia was the only country where the 2011 uprising produced durable democracy that actually functioned. His 2021 coup ended one of the most hopeful democratic chapters in Arab world history.",
    region: "Africa",
  },
  {
    id: "duda",
    name: "Andrzej Duda",
    country: "Poland",
    countryCode: "PL",
    flag: "🇵🇱",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Andrzej_Duda_official_portrait_%282022%29.jpg/440px-Andrzej_Duda_official_portrait_%282022%29.jpg",
    age: 52,
    birthYear: 1972,
    birthPlace: "Kraków, Poland",
    education: [
      {
        institution: "Jagiellonian University",
        degree: "B.A. Law",
        year: 1996,
      },
      {
        institution: "Jagiellonian University",
        degree: "Ph.D. Law",
        year: 2005,
      },
    ],
    party: "Law and Justice (PiS) — backed",
    ideology: "Conservative",
    termsInOffice: [{ from: 2015, to: "present" }],
    background:
      "Law professor and former MEP who won the 2015 presidential election for PiS and was re-elected in 2020. His presidency has been defined by a constitutional cohabitation clash with PM Donald Tusk since 2023 — Duda repeatedly uses his presidential veto to block Tusk&#39;s coalition reforms of PiS-era judicial appointments and laws, creating Poland&#39;s most acute separation-of-powers crisis since communism.",
    significantEvents: [
      {
        year: 2015,
        event:
          "Won presidential election alongside PiS&#39;s parliamentary majority",
        impact: "positive",
      },
      {
        year: 2020,
        event:
          "Re-elected with 51.03% — narrowest presidential win in Polish history",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Tusk wins election — Duda enters cohabitation as constitutional blocker",
        impact: "negative",
      },
      {
        year: 2024,
        event: "Vetoed Tusk&#39;s judicial and media reforms repeatedly",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Presidential election — Duda constitutionally barred from third term; PiS candidate faces Tusk-aligned challenger",
        impact: "neutral",
      },
    ],
    achievements: [
      "Poland&#39;s NATO defence spending raised to 4% of GDP during his presidency",
      "Fort Trump — permanent US military base in Poland secured",
      "Strong Ukraine military support from day one of Russian invasion",
      "CPK central communication hub megaproject advanced",
    ],
    politicalViews:
      "National conservative, Catholic social values, sovereign democracy (PiS model). Hawkish Russia security stance — Polish-American alliance as existential. Has blocked Tusk&#39;s judicial reforms as presidential check. Strongly pro-Ukraine.",
    approvalRating: 46,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Poland&#39;s constitutional drama — a PiS-aligned President vetoing a pro-EU PM&#39;s reforms — is Europe&#39;s most complex cohabitation battle. His term ends in 2025; Poland&#39;s presidential election will resolve whether the PiS-era judicial appointments can be unwound.",
    region: "Europe",
  },
  {
    id: "tchiani",
    name: "Abdourahamane Tchiani",
    country: "Niger",
    countryCode: "NE",
    flag: "🇳🇪",
    title: "President (Transitional)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Abdourahamane_Tchiani_2023_%28cropped%29.jpg/440px-Abdourahamane_Tchiani_2023_%28cropped%29.jpg",
    age: 62,
    birthYear: 1962,
    birthPlace: "Illéla, Niger",
    education: [
      {
        institution: "Niger Military Academy",
        degree: "Military Studies",
        year: 1984,
      },
      {
        institution: "École de Guerre, France",
        degree: "Advanced Military Studies",
        year: 1998,
      },
    ],
    party: "National Council for the Safeguard of the Homeland (CNSP)",
    ideology: "Military Junta",
    termsInOffice: [{ from: 2023, to: "present" }],
    background:
      "Commander of the Presidential Guard who led the July 2023 coup ousting elected President Mohamed Bazoum — the coup that completed the so-called &#39;coup belt&#39; across the Sahel (after Mali 2020–21, Burkina 2022, Guinea 2021). Bazoum remains held under house arrest. The coup triggered ECOWAS military intervention threats that ultimately were not carried out. Niger then expelled French, American, and EU forces, and joined the Alliance of Sahel States with Mali and Burkina Faso.",
    significantEvents: [
      {
        year: 2023,
        event:
          "Led coup ousting elected President Bazoum — completing Sahel coup belt",
        impact: "negative",
      },
      {
        year: 2023,
        event: "ECOWAS 7-day ultimatum ignored — intervention threat collapsed",
        impact: "neutral",
      },
      {
        year: 2023,
        event: "Expelled French Barkhane and US drone base forces from Niger",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Niger joins Alliance of Sahel States — left ECOWAS with Mali and Burkina",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Russia&#39;s Africa Corps deployed; US forces partially withdrawn from Agadez base",
        impact: "negative",
      },
    ],
    achievements: [
      "Completed Alliance of Sahel States bloc — AES now a functioning regional entity",
      "Expelled Western forces — delivered on domestic anti-France/US sentiment",
      "Maintained Niger&#39;s state cohesion during ECOWAS economic blockade",
      "Uranium and oil export revenues maintained through China and Russia partnerships",
    ],
    politicalViews:
      "Pan-Africanist anti-Western military nationalist. Russia security partnership, China economic partnership. Alliance of Sahel States as counter-ECOWAS institution. No democratic transition timeline. Anti-France, anti-US bases, anti-NGO presence.",
    approvalRating: null,
    approvalTrend: "down",
    status: "Transitional",
    impact:
      "Niger&#39;s coup completed the collapse of France&#39;s entire Sahel security architecture — the US&#39;s critical Agadez drone base, the largest US African intelligence hub, was also lost. His coup&#39;s consequence for counter-terrorism in the world&#39;s most jihadist-contested region will be felt for decades.",
    region: "Africa",
  },
  {
    id: "mbr",
    name: "Sheikh Mohammed bin Rashid Al Maktoum",
    country: "United Arab Emirates",
    countryCode: "AE",
    flag: "🇦🇪",
    title: "Vice President & PM of UAE / Ruler of Dubai",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Sheikh_Mohammed_bin_Rashid_Al_Maktoum_2019_%28cropped%29.jpg/440px-Sheikh_Mohammed_bin_Rashid_Al_Maktoum_2019_%28cropped%29.jpg",
    age: 75,
    birthYear: 1949,
    birthPlace: "Dubai, Trucial States (now UAE)",
    education: [
      {
        institution: "Mons Officer Cadet School, UK",
        degree: "Military Officer Training",
        year: 1967,
      },
      {
        institution: "Bell&#39;s School of Languages, UK",
        degree: "English Language",
        year: 1966,
      },
    ],
    party: "House of Maktoum (Dubai Royal family)",
    ideology: "Authoritarian",
    termsInOffice: [{ from: 2006, to: "present" }],
    background:
      "The architect of modern Dubai — the visionary ruler who transformed a small fishing port into one of the world&#39;s top tourism, aviation, logistics, and financial hubs. Serves simultaneously as Dubai&#39;s ruler, UAE&#39;s Vice President, and UAE Prime Minister — the second most powerful figure in the UAE after President MBZ. Creator of Emirates Airline, Jebel Ali Free Zone, and the Dubai World-class infrastructure that made the emirate a global brand.",
    significantEvents: [
      {
        year: 1985,
        event:
          "Founded Emirates Airline — now world&#39;s largest long-haul carrier",
        impact: "positive",
      },
      {
        year: 2006,
        event:
          "Became Dubai Ruler and UAE PM after brother Sheikh Maktoum&#39;s death",
        impact: "neutral",
      },
      {
        year: 2010,
        event: "Burj Khalifa opened — world&#39;s tallest building (828m)",
        impact: "positive",
      },
      {
        year: 2020,
        event: "Dubai hosted Expo 2020 (held 2021–22) — 25M visitors",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Dubai became world&#39;s most visited city — surpassing Paris and London",
        impact: "positive",
      },
    ],
    achievements: [
      "Emirates Airline — built from 2 planes to world&#39;s largest long-haul carrier",
      "Burj Khalifa — world&#39;s tallest building conceived and delivered under his vision",
      "Dubai ranked world&#39;s most visited city (2023) with 17M tourists",
      "DIFC (Dubai International Financial Centre) — leading global financial hub",
    ],
    politicalViews:
      "Pragmatic modernising absolute monarchist. Pro-business liberalisation without political pluralism. Dubai as global neutral hub — open to all nations. Vision-driven governance. Published poetry and books on leadership. Strategic hedging between East and West as Dubai&#39;s business model.",
    approvalRating: null,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Transformed Dubai from a regional backwater into a global city synonymous with ambition, luxury, and modernity — a feat of governance-as-placemaking unmatched in the modern era. His creation of Emirates Airline alone reshaped global aviation and made Dubai the world&#39;s international transit hub.",
    region: "Middle East",
  },
  {
    id: "boakai",
    name: "Joseph Boakai",
    country: "Liberia",
    countryCode: "LR",
    flag: "🇱🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Joseph_Boakai_2024_official_portrait.jpg/440px-Joseph_Boakai_2024_official_portrait.jpg",
    age: 79,
    birthYear: 1944,
    birthPlace: "Lofa County, Liberia",
    education: [
      {
        institution: "University of Liberia",
        degree: "B.A. Public Administration",
        year: 1969,
      },
      {
        institution: "Columbia University",
        degree: "M.A. International Affairs",
        year: 1975,
      },
    ],
    party: "Unity Party (UP)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2024, to: "present" }],
    background:
      "Former Vice President under Ellen Johnson Sirleaf (2006–2018) who ran for president twice before finally defeating incumbent George Weah in the November 2023 runoff election — inaugurated in January 2024 at age 79, making him one of Africa&#39;s oldest incoming heads of state. Liberia is West Africa&#39;s most historically significant democracy — the continent&#39;s first republic, founded by freed American slaves in 1847, and Africa&#39;s first female president (Sirleaf) preceded him.",
    significantEvents: [
      {
        year: 2017,
        event: "Lost presidential election to George Weah in dramatic upset",
        impact: "negative",
      },
      {
        year: 2023,
        event: "Defeated Weah in runoff — won at 79 years old",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Inaugurated; launched anti-corruption drive against Weah-era officials",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "US-Liberia military cooperation agreement deepened — Camp Sgt. Johnson access",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Rubber and iron ore investment attraction; governance reform commissions launched",
        impact: "positive",
      },
    ],
    achievements: [
      "Won presidency on second attempt at age 79 — remarkable democratic persistence",
      "Anti-corruption investigations of Weah-era officials launched",
      "US military cooperation framework expanded",
      "Liberia&#39;s agricultural investment strategy with World Bank advanced",
    ],
    politicalViews:
      "Social democratic, anti-corruption, pro-development investment. Close US relationship — Liberia has unique historical ties to America. Pro-ECOWAS regional integration. Rule of law restoration as defining mandate. Agricultural and resource sector diversification.",
    approvalRating: 52,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His election maintains Liberia&#39;s remarkable democratic consolidation — a country that survived two brutal civil wars to produce peaceful electoral transfers. At 79, he represents the democratic persistence of a generation that rebuilt Liberia from total devastation.",
    region: "Africa",
  },
  {
    id: "arce",
    name: "Luis Arce",
    country: "Bolivia",
    countryCode: "BO",
    flag: "🇧🇴",
    title: "Former President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Luis_Alberto_Arce_Catacora_%28cropped%29.jpg/440px-Luis_Alberto_Arce_Catacora_%28cropped%29.jpg",
    age: 61,
    birthYear: 1963,
    birthPlace: "La Paz, Bolivia",
    education: [
      {
        institution: "Mayor de San Andrés University",
        degree: "B.A. Economics",
        year: 1987,
      },
      {
        institution: "University of Warwick",
        degree: "M.A. Economics",
        year: 1997,
      },
    ],
    party: "Movement for Socialism (MAS)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2020, to: 2025 }],
    background:
      "Technocratic economist and Evo Morales&#39;s longtime Finance Minister who overseen Bolivia&#39;s commodity boom. Won the October 2020 election following Jeanine Áñez&#39;s interim government — which had replaced Morales after the disputed 2019 election and OAS fraud allegations. His tenure was consumed by a bitter split with Morales, who launched a coup attempt against him in June 2024, and a severe economic crisis as Bolivia&#39;s natural gas reserves depleted. Lost the 2025 election.",
    significantEvents: [
      {
        year: 2020,
        event: "Won election — MAS returned to power after Áñez interregnum",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "MAS split between Arce and Morales factions — party civil war began",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Military coup attempt by General Zúñiga — tanks drove into Plaza Murillo; failed in hours",
        impact: "negative",
      },
      {
        year: 2024,
        event:
          "Bolivia&#39;s foreign exchange crisis — gas revenues collapsed; chronic fuel shortage",
        impact: "negative",
      },
      {
        year: 2025,
        event: "Lost election to centrist candidate; MAS era effectively ends",
        impact: "negative",
      },
    ],
    achievements: [
      "Bolivia&#39;s electric vehicle battery supply strategy — lithium industrialisation policy",
      "Survived first military coup attempt in Bolivia in decades",
      "Social programmes maintained during economic downturn",
      "Established Bolivia&#39;s lithium state enterprise (YLB) expansion",
    ],
    politicalViews:
      "Democratic socialist, MAS ideology, indigenous rights integration, resource nationalism (lithium and gas state ownership). Economic heterodox — state intervention, currency controls. Anti-imperialist rhetoric. Bitter split with Morales dominates final years.",
    approvalRating: 24,
    approvalTrend: "down",
    status: "Former",
    impact:
      "His term ended the MAS decade by exposing its contradictions — internal factional war destroying the movement, depletion of the gas wealth that funded its social programs, and a coup attempt underlining Bolivia&#39;s perennial institutional fragility. Bolivia&#39;s lithium dream remains unrealised.",
    region: "Americas",
  },
  {
    id: "leo14",
    name: "Pope Leo XIV",
    country: "Vatican City",
    countryCode: "VA",
    flag: "🇻🇦",
    title: "Pope & Head of State, Vatican City",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Pope_Leo_XIV_%282025%29.jpg/440px-Pope_Leo_XIV_%282025%29.jpg",
    age: 69,
    birthYear: 1955,
    birthPlace: "Chicago, Illinois, USA",
    education: [
      {
        institution: "Villanova University",
        degree: "B.A. Mathematics",
        year: 1977,
      },
      {
        institution: "Augustinian College, Washington D.C.",
        degree: "M.Div. Theology",
        year: 1982,
      },
      {
        institution: "Pontifical University of Saint Thomas Aquinas",
        degree: "Ph.D. Canon Law",
        year: 1989,
      },
    ],
    party: "Holy See (non-political)",
    ideology: "Theocrat",
    termsInOffice: [{ from: 2025, to: "present" }],
    background:
      "Born Robert Francis Prevost in Chicago, the first American pope in the Catholic Church&#39;s 2,000-year history. An Augustinian friar who spent decades as a missionary in Peru — becoming a naturalised Peruvian citizen — before serving as Bishop of Chiclayo and then Prefect of the Dicastery for Bishops at the Vatican under Francis. Elected on May 8, 2025, the day following Francis&#39;s funeral, taking the name Leo XIV after Pope Leo XIII — the social justice pope of the industrial age. His name choice signals continuity with Catholic social teaching.",
    significantEvents: [
      {
        year: 1985,
        event:
          "Began Augustinian missionary work in Peru — 25+ years of service",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Appointed Prefect of the Dicastery for Bishops — key Vatican role under Francis",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Elected Pope Leo XIV on May 8 — first American Pope in Church history",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "First papal address emphasised peace, dialogue, and social justice",
        impact: "positive",
      },
    ],
    achievements: [
      "First American and first Augustinian friar to become Pope",
      "Leo XIV name choice signals Catholic social justice tradition",
      "Bilingual (English/Spanish) — bridges US and Latin American Catholicism",
      "Deep missionary formation — grassroots Church rather than Vatican careerist",
    ],
    politicalViews:
      "Progressive Catholic social teaching, continuity with Francis&#39;s approach on climate, migration, and poverty. His American origin gives him unique credibility for engaging US political Catholicism and Vatican-Washington relations. Canon law expertise shapes institutional reform agenda.",
    approvalRating: null,
    approvalTrend: "up",
    status: "In Office",
    impact:
      "An American pope fundamentally reshapes the Vatican&#39;s geopolitical optics — at a moment when the US political relationship with global Catholicism is highly contested. His dual American-Peruvian identity bridges North and South global Catholicism in a historically unprecedented way.",
    region: "Europe",
  },
  // ── BATCH 21: Horn of Africa, Great Lakes, West Africa, Balkans ───────────
  {
    id: "mohamud",
    name: "Hassan Sheikh Mohamud",
    country: "Somalia",
    countryCode: "SO",
    flag: "🇸🇴",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Hassan_Sheikh_Mohamud_2022_%28cropped%29.jpg/440px-Hassan_Sheikh_Mohamud_2022_%28cropped%29.jpg",
    age: 69,
    birthYear: 1955,
    birthPlace: "Beledweyne, Hiiraan, Somalia",
    education: [
      {
        institution: "Somali National University",
        degree: "B.Sc. Education",
        year: 1981,
      },
      {
        institution: "Pune University, India",
        degree: "M.Sc. Management",
        year: 1998,
      },
    ],
    party: "Peace and Development Party (PDP)",
    ideology: "Centrist",
    termsInOffice: [
      { from: 2012, to: 2017 },
      { from: 2022, to: "present" },
    ],
    background:
      "Academic and civil society leader who served as Somalia&#39;s first post-transitional president (2012–2017), then returned for a second term in May 2022 after a fractious delayed election. Nicknamed &#39;HSM&#39;, he governs one of the world&#39;s most fragile states — simultaneously waging an offensive against al-Shabaab militants, managing clan politics, fending off Ethiopia&#39;s controversial Red Sea deal with Somaliland, and pursuing UAE and Turkish infrastructure investments.",
    significantEvents: [
      {
        year: 2012,
        event:
          "Elected Somalia&#39;s first post-transition president — milestone in state-building",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Won second term after months-long election delay — legitimacy restored",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Launched major anti-al-Shabaab offensive — recaptured significant territory",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Ethiopia–Somaliland MOU on Red Sea access — Somalia furious, recalled ambassador",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Somalia applies for EAC membership; UAE Berbera base diplomacy ongoing",
        impact: "neutral",
      },
    ],
    achievements: [
      "Led Somalia&#39;s largest military offensive against al-Shabaab in a decade",
      "Restored Mogadishu&#39;s port and airport infrastructure",
      "Somalia granted IMF/World Bank debt relief after years of negotiation",
      "International recognition restored — Somalia back in multilateral diplomacy",
    ],
    politicalViews:
      "Centrist, moderate Islamist roots but governing as pragmatic nationalist. Pro-Arab League, pro-Turkey and UAE investment, suspicious of Ethiopian regional ambitions. Clan-balancing governance model. Seeks US counter-terrorism partnership while maintaining Islamic identity.",
    approvalRating: 48,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Leads one of the world&#39;s most complex governance challenges — a fractious clan state rebuilding from complete collapse against an active jihadist insurgency, with regional powers (Ethiopia, UAE, Turkey) all competing for influence over its territory.",
    region: "Africa",
  },
  {
    id: "burhan",
    name: "Abdel Fattah al-Burhan",
    country: "Sudan",
    countryCode: "SD",
    flag: "🇸🇩",
    title: "President (SAC Chairman)",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Abdel_Fattah_al-Burhan_%282021_cropped%29.jpg/440px-Abdel_Fattah_al-Burhan_%282021_cropped%29.jpg",
    age: 64,
    birthYear: 1960,
    birthPlace: "Gezira State, Sudan",
    education: [
      {
        institution: "Sudan Military Academy",
        degree: "Military Studies",
        year: 1981,
      },
      {
        institution: "Egyptian Military Academy",
        degree: "Advanced Military Studies",
        year: 1995,
      },
    ],
    party: "Sudanese Armed Forces (SAF) — transitional junta",
    ideology: "Military Junta",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Senior infantry general who became head of the Sovereignty Council (transitional head of state) in 2019 after al-Bashir&#39;s ouster. Led the October 2021 coup that dissolved the civilian transitional government. In April 2023, the long-simmering power struggle with the Rapid Support Forces (RSF) under Mohamed Hamdan Dagalo (&#39;Hemeti&#39;) exploded into full-scale civil war — now one of the world&#39;s worst humanitarian disasters, with 8M+ displaced and mass atrocities documented.",
    significantEvents: [
      {
        year: 2019,
        event:
          "Became SAC (Sovereignty Council) chairman after al-Bashir&#39;s removal",
        impact: "neutral",
      },
      {
        year: 2021,
        event:
          "Staged coup dissolving civilian transitional government — international condemnation",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Civil war erupted with RSF — Khartoum fell; catastrophic displacement",
        impact: "negative",
      },
      {
        year: 2024,
        event: "SAF lost Khartoum; Port Sudan became de facto capital",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "SAF recaptured parts of Khartoum; war continues with millions starving",
        impact: "negative",
      },
    ],
    achievements: [
      "Maintained SAF cohesion as a fighting force through unprecedented civil war",
      "Secured UAE and Egypt military support for SAF",
      "Retained Sudan&#39;s UN seat and international recognition vs RSF",
      "SAF recapture of parts of Khartoum in 2025 — partial military reversal",
    ],
    politicalViews:
      "Military nationalist, Islamist-adjacent (unlike RSF&#39;s secular-criminal model). Anti-civilian-rule in practice despite rhetoric. UAE and Egypt-backed. Anti-Ethiopian influence in Sudan. Refuses ICC jurisdiction over atrocity allegations.",
    approvalRating: null,
    approvalTrend: "down",
    status: "Transitional",
    impact:
      "Presides over what the UN calls the world&#39;s worst humanitarian crisis — Sudan&#39;s civil war has killed tens of thousands and displaced 10M+ in under two years. The conflict is reshaping the Horn of Africa&#39;s geopolitics as Gulf states, Egypt, and Wagner-linked forces back rival factions.",
    region: "Africa",
  },
  {
    id: "ramkalawan",
    name: "Wavel Ramkalawan",
    country: "Seychelles",
    countryCode: "SC",
    flag: "🇸🇨",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Wavel_Ramkalawan_2020_official_portrait.jpg/440px-Wavel_Ramkalawan_2020_official_portrait.jpg",
    age: 64,
    birthYear: 1961,
    birthPlace: "Victoria, Seychelles",
    education: [
      {
        institution: "University of Seychelles",
        degree: "B.A. Theology",
        year: 1988,
      },
      {
        institution: "University of Birmingham",
        degree: "M.A. Theology",
        year: 1992,
      },
    ],
    party: "Linyon Demokratik Seselwa (LDS)",
    ideology: "Social Democrat",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Anglican priest turned politician who fought in opposition for 25 years — losing four consecutive presidential elections to the ruling SPPF/PL party — before finally winning the 2020 election with 54.9%, ending 43 years of one-party dominance. One of Africa&#39;s most significant democratic transitions. Governs the Indian Ocean&#39;s wealthiest nation per capita — with the world&#39;s highest tourism-to-population ratio and significant Chinese and UAE investment.",
    significantEvents: [
      {
        year: 1998,
        event: "First presidential run — lost to France-Albert René&#39;s SPPF",
        impact: "neutral",
      },
      {
        year: 2020,
        event:
          "Won election after 5 attempts — ended 43 years of one-party rule",
        impact: "positive",
      },
      {
        year: 2021,
        event:
          "Seychelles became world&#39;s first country to fully vaccinate population against COVID",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Deepened Blue Economy strategy — 1.3M km² exclusive economic zone",
        impact: "positive",
      },
      {
        year: 2024,
        event:
          "Indian Ocean geopolitics — Seychelles navigates US, China, France naval presence",
        impact: "neutral",
      },
    ],
    achievements: [
      "Ended 43-year one-party rule through democratic election after 5 attempts",
      "Seychelles first in world to fully vaccinate entire population vs COVID",
      "Blue Economy framework developed for 1.3M km² maritime zone",
      "Seychelles ranked Africa&#39;s highest Human Development Index nation under his watch",
    ],
    politicalViews:
      "Social democratic, pro-good governance, anti-corruption. Blue Economy — ocean conservation and sustainable fishing as economic model. Non-aligned between competing great powers in Indian Ocean. Commonwealth and African Union multilateralism.",
    approvalRating: 58,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "His 2020 victory is one of Africa&#39;s most celebrated democratic moments — a priest who never stopped running eventually broke a 43-year political monopoly. Seychelles under Ramkalawan is the Indian Ocean&#39;s leading example of small-state democratic governance.",
    region: "Africa",
  },
  {
    id: "ndayishimiye",
    name: "Évariste Ndayishimiye",
    country: "Burundi",
    countryCode: "BI",
    flag: "🇧🇮",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Evariste_Ndayishimiye_2020_official_portrait.jpg/440px-Evariste_Ndayishimiye_2020_official_portrait.jpg",
    age: 56,
    birthYear: 1968,
    birthPlace: "Gitega, Burundi",
    education: [
      {
        institution: "University of Burundi",
        degree: "B.Sc. Economics",
        year: 1992,
      },
      {
        institution: "Royal Military Academy, Belgium",
        degree: "Advanced Military Studies",
        year: 2000,
      },
    ],
    party: "CNDD-FDD (National Council for the Defense of Democracy)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Military general and Secretary-General of the ruling CNDD-FDD who was handpicked by outgoing de facto ruler Pierre Nkurunziza — who died suddenly of COVID in June 2020 before Ndayishimiye was inaugurated. Surprisingly broke from Nkurunziza&#39;s most repressive policies, acknowledging COVID (which Nkurunziza had called divine protection), releasing some political prisoners, and pursuing re-engagement with the EU and IMF after years of isolation following the 2015 crisis.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Won election — inaugurated as Nkurunziza died suddenly of COVID",
        impact: "neutral",
      },
      {
        year: 2020,
        event: "Acknowledged COVID reality — reversed Nkurunziza&#39;s denial",
        impact: "positive",
      },
      {
        year: 2021,
        event:
          "EU partially restored development cooperation after 5-year freeze",
        impact: "positive",
      },
      {
        year: 2023,
        event: "IMF engagement resumed — first structural programme since 2015",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Tensions with Rwanda and DRC over eastern Congo conflict continue",
        impact: "negative",
      },
    ],
    achievements: [
      "Broke from Nkurunziza&#39;s COVID denialism — accepted vaccines and masks",
      "EU aid restoration after 5-year isolation following 2015 political crisis",
      "IMF programme re-engagement — first since Nkurunziza&#39;s break",
      "Some political prisoners released — partial opening from total repression",
    ],
    politicalViews:
      "CNDD-FDD nationalist with pragmatic reform elements. Anti-Western human rights criticism domestically, but willing to engage multilaterals for development funding. Burundian sovereignty framing. Suspicious of Rwanda&#39;s regional ambitions.",
    approvalRating: 41,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Represents a cautious opening from one of Africa&#39;s most isolated post-2015 states. Burundi remains deeply poor and authoritarian, but Ndayishimiye&#39;s partial pragmatism distinguishes him from his predecessor&#39;s complete international isolation.",
    region: "Africa",
  },
  {
    id: "embalo",
    name: "Umaro Sissoco Embaló",
    country: "Guinea-Bissau",
    countryCode: "GW",
    flag: "🇬🇼",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Umaro_Sissoco_Embal%C3%B3_2020_%28cropped%29.jpg/440px-Umaro_Sissoco_Embal%C3%B3_2020_%28cropped%29.jpg",
    age: 52,
    birthYear: 1972,
    birthPlace: "Bissau, Portuguese Guinea (now Guinea-Bissau)",
    education: [
      {
        institution: "Military Academy, Portugal",
        degree: "Military Studies",
        year: 1994,
      },
      {
        institution: "King&#39;s College London",
        degree: "M.A. Security Studies",
        year: 2004,
      },
    ],
    party: "MADEM G-15",
    ideology: "Centrist",
    termsInOffice: [{ from: 2020, to: "present" }],
    background:
      "Former military general and Prime Minister who won a disputed 2019 presidential election that was resolved in his favour by the Supreme Court in 2020 after a protracted standoff. Guinea-Bissau has experienced more coups than almost any African state — 9 successful or attempted coups since independence in 1974. Embaló has asserted strong presidential authority, dissolved parliaments multiple times, and steered the country toward ECOWAS and international stability while navigating its historic status as a major cocaine transshipment point from Latin America.",
    significantEvents: [
      {
        year: 2020,
        event:
          "Took office after Supreme Court confirmed his disputed election win",
        impact: "positive",
      },
      {
        year: 2022,
        event:
          "Survived coup attempt in February — armed attack on government palace",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Dissolved parliament for second time — political instability continues",
        impact: "negative",
      },
      {
        year: 2023,
        event:
          "Chaired ECOWAS during Sahel coup crisis — led Niger ultimatum discussions",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "Guinea-Bissau economic growth from cashew exports and diversification",
        impact: "positive",
      },
    ],
    achievements: [
      "Survived coup attempt in 2022 — maintained civilian government",
      "Chaired ECOWAS during the most turbulent period for the bloc in its history",
      "Longest-serving stable president in Guinea-Bissau since independence",
      "Cashew export modernisation programme advanced",
    ],
    politicalViews:
      "Pragmatic centrist, ECOWAS institutionalist, strong presidential authority. Anti-drug trafficking rhetoric despite structural state-trafficking nexus. Pro-Portugal relations, pro-EU cooperation. Non-ideological governing style.",
    approvalRating: 44,
    approvalTrend: "stable",
    status: "In Office",
    impact:
      "Provides the closest thing to political stability Guinea-Bissau has seen in decades — though his repeated parliament dissolutions show the limits of that stability. His ECOWAS chairmanship during the Sahel coup wave made him one of West Africa&#39;s most prominent faces in 2023.",
    region: "Africa",
  },
  {
    id: "ghazouani",
    name: "Mohamed Ould Ghazouani",
    country: "Mauritania",
    countryCode: "MR",
    flag: "🇲🇷",
    title: "President",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Mohamed_Ould_Ghazouani_2019_official_portrait.jpg/440px-Mohamed_Ould_Ghazouani_2019_official_portrait.jpg",
    age: 68,
    birthYear: 1956,
    birthPlace: "Méderdra, Mauritania",
    education: [
      {
        institution: "Mauritanian Military Academy",
        degree: "Military Studies",
        year: 1978,
      },
      {
        institution: "École de Guerre, France",
        degree: "Advanced Military Studies",
        year: 1990,
      },
    ],
    party: "El Insaf (Equity) Party",
    ideology: "Conservative",
    termsInOffice: [{ from: 2019, to: "present" }],
    background:
      "Former army chief and Defence Minister who won the 2019 presidential election — the first peaceful democratic transfer of power in Mauritania&#39;s history — after outgoing President Mohamed Ould Abdel Aziz stepped down constitutionally. Won re-election in 2024 with 56%. Mauritania is the Sahel&#39;s striking outlier: it borders Mali and has faced jihadist threats since 2008, but has not experienced a coup since 2008 and has contained al-Qaeda via a combination of military pressure and negotiated tribal agreements.",
    significantEvents: [
      {
        year: 2019,
        event:
          "Won election in Mauritania&#39;s first peaceful transfer of power",
        impact: "positive",
      },
      {
        year: 2021,
        event:
          "Mauritania ranked Africa&#39;s most improved governance — Mo Ibrahim Foundation",
        impact: "positive",
      },
      {
        year: 2023,
        event:
          "Maintained Mauritania&#39;s counter-terrorism success as neighbours fell to coups",
        impact: "positive",
      },
      {
        year: 2024,
        event: "Re-elected with 56% — stability mandate confirmed",
        impact: "positive",
      },
      {
        year: 2025,
        event:
          "EU-Mauritania gas pipeline partnership discussions — offshore gas development",
        impact: "positive",
      },
    ],
    achievements: [
      "Mauritania&#39;s first-ever peaceful democratic handover of power",
      "Mo Ibrahim Prize governance recognition — among Africa&#39;s most improved",
      "Counter-terrorism model — Sahel&#39;s only country not experiencing coup or collapse",
      "EU gas pipeline partnership for offshore Mauritanian reserves",
    ],
    politicalViews:
      "Conservative military-origin leader with genuine democratic transition credentials. Anti-Islamist militancy through combination of security and social integration. Pro-EU partnership, non-aligned on US-China, Arabic League solidarity. Slave trade abolition enforcement advanced.",
    approvalRating: 56,
    approvalTrend: "up",
    status: "In Office",
    impact:
      "Mauritania under Ghazouani is the Sahel&#39;s most important success story — a counter-example to Mali, Burkina, and Niger&#39;s coups and jihadist expansion. Understanding why Mauritania succeeded while neighbours collapsed is one of Africa&#39;s most consequential policy questions.",
    region: "Africa",
  },
  {
    id: "dodik",
    name: "Milorad Dodik",
    country: "Bosnia & Herzegovina (Republika Srpska)",
    countryCode: "BA",
    flag: "🇧🇦",
    title: "President, Republika Srpska",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Milorad_Dodik_2019_%28cropped%29.jpg/440px-Milorad_Dodik_2019_%28cropped%29.jpg",
    age: 65,
    birthYear: 1959,
    birthPlace: "Laktaši, SR Bosnia and Herzegovina (now Bosnia)",
    education: [
      {
        institution: "University of Belgrade",
        degree: "B.A. Political Science",
        year: 1984,
      },
      {
        institution: "University of Belgrade",
        degree: "M.A. Political Science",
        year: 1988,
      },
    ],
    party: "Alliance of Independent Social Democrats (SNSD)",
    ideology: "Nationalist",
    termsInOffice: [{ from: 2022, to: "present" }],
    background:
      "The most provocative Bosnian Serb politician since Radovan Karadžić — Dodik has spent 15 years threatening Bosnian Serb secession, denying the Srebrenica genocide, blocking Bosnian state institutions, and aligning with Serbia&#39;s Vučić, Hungary&#39;s Orbán, and Russia&#39;s Putin. In 2023 he was sanctioned by the US and UK. In 2025 he was convicted and sentenced to a prison term that he refuses to recognise, triggering Bosnia&#39;s worst constitutional crisis since the war.",
    significantEvents: [
      {
        year: 2006,
        event:
          "Became RS Prime Minister — began systematic obstruction of Bosnian state institutions",
        impact: "negative",
      },
      {
        year: 2021,
        event:
          "Republika Srpska&#39;s military celebration — violation of Dayton Agreement",
        impact: "negative",
      },
      {
        year: 2022,
        event:
          "Became Republika Srpska President — escalated secession threats",
        impact: "negative",
      },
      {
        year: 2023,
        event: "US Treasury and UK imposed sanctions for destabilising Bosnia",
        impact: "negative",
      },
      {
        year: 2025,
        event:
          "Convicted by Bosnian court; sentenced to prison; refuses to comply — constitutional crisis",
        impact: "negative",
      },
    ],
    achievements: [
      "Republika Srpska maintained within Bosnia&#39;s federal structure",
      "RS economic ties with Serbia and Russia maintained",
      "Gas supply through Republika Srpska&#39;s SRBIJAGAS connections preserved",
      "Demonstrated limits of Dayton enforcement mechanisms",
    ],
    politicalViews:
      "Greater Serbia nationalism, Republika Srpska independence goal. Genocide denial on Srebrenica. Pro-Russia, anti-NATO expansion, anti-EU integration path. Aligns with Vučić, Orbán, and Putin. Views Bosnia&#39;s state institutions as illegitimate impositions.",
    approvalRating: 43,
    approvalTrend: "stable",
    status: "Incumbent (Disputed)",
    impact:
      "Europe&#39;s most dangerous destabiliser east of the Kremlin. His 2025 conviction and refusal to comply triggered Bosnia&#39;s worst post-war crisis — testing whether the EU and NATO have the will to enforce Dayton when its most provocative violator simply ignores court orders.",
    region: "Europe",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const IDEOLOGY_COLORS: Record<Ideology, string> = {
  Conservative: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Liberal: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "Social Democrat": "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Nationalist: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Communist: "bg-red-600/15 text-red-400 border-red-600/30",
  Authoritarian: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  Centrist: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Populist: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Theocrat: "bg-emerald-700/15 text-emerald-400 border-emerald-700/30",
  Progressive: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  "Military Junta": "bg-stone-600/15 text-stone-400 border-stone-600/30",
  Monarchy: "bg-yellow-700/15 text-yellow-400 border-yellow-700/30",
};

const IMPACT_COLORS: Record<string, string> = {
  positive: "text-green-400",
  negative: "text-red-400",
  neutral: "text-muted-foreground",
};

const IMPACT_ICONS: Record<string, React.ReactNode> = {
  positive: (
    <CheckCircle size={13} weight="fill" className="text-green-400 shrink-0" />
  ),
  negative: (
    <XCircle size={13} weight="fill" className="text-red-400 shrink-0" />
  ),
  neutral: (
    <CalendarBlank
      size={13}
      weight="fill"
      className="text-muted-foreground shrink-0"
    />
  ),
};

const REGIONS = [
  "All Regions",
  "Americas",
  "Europe",
  "Asia-Pacific",
  "Middle East",
  "Africa",
];

function ApprovalBar({
  value,
  trend,
}: {
  value: number | null;
  trend: "up" | "down" | "stable";
}) {
  if (value === null)
    return (
      <div className="text-xs text-muted-foreground font-mono italic">
        No public data
      </div>
    );
  const color = value >= 60 ? "#34d399" : value >= 40 ? "#fbbf24" : "#f87171";
  const TrendIcon =
    trend === "up" ? CaretUp : trend === "down" ? CaretDown : null;
  const trendColor =
    trend === "up"
      ? "text-green-400"
      : trend === "down"
        ? "text-red-400"
        : "text-muted-foreground";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-sans">
          Approval Rating
        </span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold font-mono" style={{ color }}>
            {value}%
          </span>
          {TrendIcon && (
            <TrendIcon size={12} className={trendColor} weight="fill" />
          )}
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function LeaderCard({
  leader,
  onClick,
  isSelected,
}: {
  leader: Leader;
  onClick: () => void;
  isSelected: boolean;
}) {
  const currentTerm = leader.termsInOffice[leader.termsInOffice.length - 1];
  const yearsInCurrentRole =
    currentTerm.to === "present"
      ? new Date().getFullYear() - currentTerm.from
      : currentTerm.to - currentTerm.from;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all duration-200 overflow-hidden group ${
        isSelected
          ? "border-secondary/70 bg-secondary/5 ring-1 ring-secondary/30"
          : "border-border bg-card hover:border-secondary/40 hover:bg-card/80 hover:scale-[1.01] hover:shadow-lg"
      }`}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-lg overflow-hidden border border-border flex items-center justify-center bg-muted/30">
            <img
              src={`https://flagcdn.com/w80/${leader.countryCode.toLowerCase()}.png`}
              alt={`${leader.country} flag`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.parentElement as HTMLElement).innerHTML =
                  `<span class="text-2xl">${leader.flag}</span>`;
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="font-semibold text-sm text-foreground leading-tight truncate">
              {leader.name}
            </p>
            <span
              className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border ${IDEOLOGY_COLORS[leader.ideology]}`}
            >
              {leader.ideology}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1 truncate">
            {leader.title} · {leader.country}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono text-foreground/70">
              {currentTerm.from}–
              {currentTerm.to === "present" ? "Now" : currentTerm.to}
            </span>
            <span className="mx-1 text-border">·</span>
            <span>{yearsInCurrentRole}y in role</span>
          </p>
          {leader.approvalRating !== null && (
            <div className="mt-2">
              <ApprovalBar
                value={leader.approvalRating}
                trend={leader.approvalTrend}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function LeaderDetail({
  leader,
  onClose,
}: {
  leader: Leader;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "career" | "events" | "views">(
    "overview",
  );

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: <Globe size={13} /> },
    {
      id: "career" as const,
      label: "Career & Education",
      icon: <GraduationCap size={13} />,
    },
    {
      id: "events" as const,
      label: "Significant Events",
      icon: <CalendarBlank size={13} />,
    },
    {
      id: "views" as const,
      label: "Political Views",
      icon: <Scales size={13} />,
    },
  ];

  const totalYears = leader.termsInOffice.reduce((acc, t) => {
    const end = t.to === "present" ? new Date().getFullYear() : t.to;
    return acc + (end - t.from);
  }, 0);

  return (
    <div className="modal-glass border rounded-xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
      {/* Hero banner */}
      <div className="relative h-32 overflow-hidden shrink-0">
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-4">
          <div className="pb-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">
                {leader.name}
              </h2>
              <span className="text-lg">{leader.flag}</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${IDEOLOGY_COLORS[leader.ideology]}`}
              >
                {leader.ideology}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {leader.title} · {leader.country}
            </p>
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
        aria-label="Close"
      >
        <XCircle size={18} weight="fill" />
      </button>

      {/* Key stats strip */}
      <div className="grid grid-cols-4 divide-x divide-border/40 border-b border-border/40">
        {[
          {
            label: "Age",
            value: `${leader.age}`,
            sub: `b. ${leader.birthYear}`,
          },
          {
            label: "Party",
            value: leader.party.split(" ")[0],
            sub: leader.party,
          },
          {
            label: "Yrs in Power",
            value: `${totalYears}y`,
            sub: `${leader.termsInOffice.length} term${leader.termsInOffice.length > 1 ? "s" : ""}`,
          },
          {
            label: "Approval",
            value:
              leader.approvalRating !== null
                ? `${leader.approvalRating}%`
                : "N/A",
            sub:
              leader.approvalRating !== null
                ? leader.approvalTrend === "up"
                  ? "↑ Rising"
                  : leader.approvalTrend === "down"
                    ? "↓ Falling"
                    : "→ Stable"
                : "No public data",
          },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 text-center modal-tile">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-base font-bold font-mono text-foreground">
              {s.value}
            </p>
            <p
              className="text-[10px] text-muted-foreground truncate"
              title={s.sub}
            >
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium font-sans whitespace-nowrap transition-colors border-b-2 ${
              tab === t.id
                ? "border-secondary text-secondary leader-tab-active"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5 space-y-5">
        {tab === "overview" && (
          <>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <BookOpen size={12} /> Background
              </h4>
              <p className="text-sm text-foreground leading-relaxed">
                {leader.background}
              </p>
            </div>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Trophy size={12} /> Key Achievements
              </h4>
              <ul className="space-y-1.5">
                {leader.achievements.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <CheckCircle
                      size={14}
                      weight="fill"
                      className="text-green-400 mt-0.5 shrink-0"
                    />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <ChartLineUp size={12} /> Impact Assessment
              </h4>
              <p className="text-sm text-foreground leading-relaxed">
                {leader.impact}
              </p>
            </div>
            <div className="modal-tile rounded-xl p-4">
              <ApprovalBar
                value={leader.approvalRating}
                trend={leader.approvalTrend}
              />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Flag size={12} /> Status
              </h4>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full border ${
                  leader.status === "In Office"
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : leader.status === "Incumbent (Disputed)"
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                      : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                }`}
              >
                {leader.status}
              </span>
            </div>
          </>
        )}

        {tab === "career" && (
          <>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <GraduationCap size={12} /> Education
              </h4>
              <div className="space-y-3">
                {leader.education.map((e, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                      <GraduationCap size={14} className="text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {e.degree}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.institution}
                        {e.year ? ` · ${e.year}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Buildings size={12} /> Terms in Office
              </h4>
              <div className="space-y-2">
                {leader.termsInOffice.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                    <span className="text-sm font-mono text-foreground">
                      {t.from} –{" "}
                      {t.to === "present" ? (
                        <span className="text-secondary font-semibold">
                          Present
                        </span>
                      ) : (
                        t.to
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (
                      {(t.to === "present" ? new Date().getFullYear() : t.to) -
                        t.from}{" "}
                      years)
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Handshake size={12} /> Party & Affiliation
              </h4>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${IDEOLOGY_COLORS[leader.ideology]}`}
                >
                  {leader.ideology}
                </span>
                <span className="text-sm text-foreground">{leader.party}</span>
              </div>
            </div>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Users size={12} /> Personal
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="modal-tile rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Born
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {leader.birthYear}
                  </p>
                </div>
                <div className="modal-tile rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Birthplace
                  </p>
                  <p className="text-xs text-foreground leading-snug">
                    {leader.birthPlace}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "events" && (
          <div className="modal-tile rounded-xl p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
              <CalendarBlank size={12} /> Timeline of Significant Events
            </h4>
            <div className="relative pl-5">
              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-5">
                {leader.significantEvents.map((e, i) => (
                  <div key={i} className="relative">
                    <div
                      className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 border-background ${
                        e.impact === "positive"
                          ? "bg-green-400"
                          : e.impact === "negative"
                            ? "bg-red-400"
                            : "bg-muted-foreground"
                      }`}
                    />
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold font-mono text-secondary shrink-0 w-10">
                        {e.year}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start gap-1.5">
                          {IMPACT_ICONS[e.impact]}
                          <p
                            className="text-sm text-foreground leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: e.event }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "views" && (
          <>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Strategy size={12} /> Political Ideology
              </h4>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${IDEOLOGY_COLORS[leader.ideology]}`}
                >
                  {leader.ideology}
                </span>
                <span className="text-sm text-muted-foreground">
                  {leader.party}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {leader.politicalViews}
              </p>
            </div>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <ChartLineUp size={12} /> Overall Impact
              </h4>
              <p className="text-sm text-foreground leading-relaxed">
                {leader.impact}
              </p>
            </div>
            <div className="modal-tile rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Star size={12} /> Achievements
              </h4>
              <ul className="space-y-1.5">
                {leader.achievements.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <CheckCircle
                      size={14}
                      weight="fill"
                      className="text-secondary mt-0.5 shrink-0"
                    />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Political Compass Component ───────────────────────────────────────────────
function PoliticalCompass({
  leaders,
  onSelect,
}: {
  leaders: Leader[];
  onSelect: (l: Leader) => void;
}) {
  const [tooltip, setTooltip] = useState<{
    leader: Leader;
    x: number;
    y: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Map -10..+10 to SVG coords (padding 40px on 500px canvas)
  const PAD = 40;
  const SIZE = 500;
  const inner = SIZE - PAD * 2;
  const toSvgX = (v: number) => PAD + ((v + 10) / 20) * inner;
  const toSvgY = (v: number) => PAD + ((10 - v) / 20) * inner;

  const dotColor = (l: Leader) => {
    const map: Partial<Record<Ideology, string>> = {
      Conservative: "#60a5fa",
      Liberal: "#38bdf8",
      "Social Democrat": "#f87171",
      Nationalist: "#fb923c",
      Communist: "#ef4444",
      Authoritarian: "#a1a1aa",
      Centrist: "#c084fc",
      Populist: "#fbbf24",
      Theocrat: "#34d399",
      Progressive: "#2dd4bf",
      "Military Junta": "#78716c",
      Monarchy: "#eab308",
    };
    return map[l.ideology] ?? "#94a3b8";
  };

  const leadersWithCoords = leaders.filter((l) => COMPASS_DATA[l.id]);

  return (
    <div className="relative w-full select-none">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.keys(IDEOLOGY_COLORS) as Ideology[]).map((k) => (
          <div key={k} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{
                background:
                  (
                    {
                      Conservative: "#60a5fa",
                      Liberal: "#38bdf8",
                      "Social Democrat": "#f87171",
                      Nationalist: "#fb923c",
                      Communist: "#ef4444",
                      Authoritarian: "#a1a1aa",
                      Centrist: "#c084fc",
                      Populist: "#fbbf24",
                      Theocrat: "#34d399",
                      Progressive: "#2dd4bf",
                      "Military Junta": "#78716c",
                      Monarchy: "#eab308",
                    } as Record<Ideology, string>
                  )[k] ?? "#94a3b8",
              }}
            />
            <span className="text-[10px] text-muted-foreground">{k}</span>
          </div>
        ))}
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-card">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full"
          style={{ minWidth: 320 }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Background quadrant fills */}
          <rect
            x={PAD}
            y={PAD}
            width={inner / 2}
            height={inner / 2}
            fill="rgba(239,68,68,0.05)"
            rx="2"
          />
          <rect
            x={PAD + inner / 2}
            y={PAD}
            width={inner / 2}
            height={inner / 2}
            fill="rgba(96,165,250,0.05)"
            rx="2"
          />
          <rect
            x={PAD}
            y={PAD + inner / 2}
            width={inner / 2}
            height={inner / 2}
            fill="rgba(248,113,113,0.05)"
            rx="2"
          />
          <rect
            x={PAD + inner / 2}
            y={PAD + inner / 2}
            width={inner / 2}
            height={inner / 2}
            fill="rgba(34,197,94,0.05)"
            rx="2"
          />

          {/* Grid lines */}
          {[-8, -6, -4, -2, 0, 2, 4, 6, 8].map((v) => (
            <g key={v}>
              <line
                x1={toSvgX(v)}
                y1={PAD}
                x2={toSvgX(v)}
                y2={SIZE - PAD}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
              <line
                x1={PAD}
                y1={toSvgY(v)}
                x2={SIZE - PAD}
                y2={toSvgY(v)}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Axes */}
          <line
            x1={PAD}
            y1={SIZE / 2}
            x2={SIZE - PAD}
            y2={SIZE / 2}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />
          <line
            x1={SIZE / 2}
            y1={PAD}
            x2={SIZE / 2}
            y2={SIZE - PAD}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />

          {/* Axis labels */}
          <text
            x={PAD + 4}
            y={SIZE / 2 - 6}
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
            fontFamily="monospace"
          >
            ← Economic Left
          </text>
          <text
            x={SIZE - PAD - 4}
            y={SIZE / 2 - 6}
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
            fontFamily="monospace"
            textAnchor="end"
          >
            Economic Right →
          </text>
          <text
            x={SIZE / 2 + 4}
            y={PAD + 12}
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
            fontFamily="monospace"
          >
            ↑ Libertarian
          </text>
          <text
            x={SIZE / 2 + 4}
            y={SIZE - PAD - 4}
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
            fontFamily="monospace"
          >
            ↓ Authoritarian
          </text>

          {/* Quadrant labels */}
          <text
            x={PAD + 8}
            y={PAD + 18}
            fontSize="8"
            fill="rgba(239,68,68,0.4)"
            fontFamily="sans-serif"
            fontWeight="600"
          >
            AUTH LEFT
          </text>
          <text
            x={SIZE - PAD - 8}
            y={PAD + 18}
            fontSize="8"
            fill="rgba(96,165,250,0.4)"
            fontFamily="sans-serif"
            fontWeight="600"
            textAnchor="end"
          >
            AUTH RIGHT
          </text>
          <text
            x={PAD + 8}
            y={SIZE - PAD - 8}
            fontSize="8"
            fill="rgba(248,113,113,0.4)"
            fontFamily="sans-serif"
            fontWeight="600"
          >
            LIB LEFT
          </text>
          <text
            x={SIZE - PAD - 8}
            y={SIZE - PAD - 8}
            fontSize="8"
            fill="rgba(34,197,94,0.4)"
            fontFamily="sans-serif"
            fontWeight="600"
            textAnchor="end"
          >
            LIB RIGHT
          </text>

          {/* Leader dots */}
          {leadersWithCoords.map((l) => {
            const coords = COMPASS_DATA[l.id];
            const cx = toSvgX(coords.economicX);
            const cy = toSvgY(coords.socialY);
            return (
              <g
                key={l.id}
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) setTooltip({ leader: l, x: cx, y: cy });
                }}
                onClick={() => onSelect(l)}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  fill={dotColor(l)}
                  fillOpacity={0.85}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="1"
                />
                <text
                  x={cx}
                  y={cy + 3}
                  fontSize="6.5"
                  textAnchor="middle"
                  fill="rgba(0,0,0,0.8)"
                  fontWeight="700"
                  pointerEvents="none"
                >
                  {l.flag}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip &&
            (() => {
              const cx = toSvgX(COMPASS_DATA[tooltip.leader.id].economicX);
              const cy = toSvgY(COMPASS_DATA[tooltip.leader.id].socialY);
              const boxW = 120;
              const boxH = 44;
              const tx = cx + 10 + boxW > SIZE - PAD ? cx - boxW - 10 : cx + 10;
              const ty =
                cy - boxH / 2 < PAD
                  ? PAD
                  : cy + boxH / 2 > SIZE - PAD
                    ? SIZE - PAD - boxH
                    : cy - boxH / 2;
              return (
                <g pointerEvents="none">
                  <rect
                    x={tx}
                    y={ty}
                    width={boxW}
                    height={boxH}
                    rx="5"
                    fill="rgba(15,15,20,0.95)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                  />
                  <text
                    x={tx + 8}
                    y={ty + 14}
                    fontSize="9"
                    fill="white"
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >
                    {tooltip.leader.name}
                  </text>
                  <text
                    x={tx + 8}
                    y={ty + 24}
                    fontSize="8"
                    fill="rgba(255,255,255,0.6)"
                    fontFamily="sans-serif"
                  >
                    {tooltip.leader.country}
                  </text>
                  <text
                    x={tx + 8}
                    y={ty + 35}
                    fontSize="7.5"
                    fill="rgba(255,255,255,0.45)"
                    fontFamily="monospace"
                  >
                    Econ{" "}
                    {COMPASS_DATA[tooltip.leader.id].economicX > 0 ? "+" : ""}
                    {COMPASS_DATA[tooltip.leader.id].economicX} · Soc{" "}
                    {COMPASS_DATA[tooltip.leader.id].socialY > 0 ? "+" : ""}
                    {COMPASS_DATA[tooltip.leader.id].socialY}
                  </text>
                </g>
              );
            })()}
        </svg>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Click any dot to open the leader&#39;s profile. Hover to see details.
        Positions are approximate based on policy analysis.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function WorldMapPage() {
  const [region, setRegion] = useState("All Regions");
  const [ideology, setIdeology] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Leader | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "compass">("list");

  const ideologies = [
    "All",
    ...Array.from(new Set(LEADERS.map((l) => l.ideology))).sort(),
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LEADERS.filter((l) => {
      const matchRegion = region === "All Regions" || l.region === region;
      const matchIdeology = ideology === "All" || l.ideology === ideology;
      const matchSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.party.toLowerCase().includes(q);
      return matchRegion && matchIdeology && matchSearch;
    });
  }, [region, ideology, search]);

  const inOffice = LEADERS.filter(
    (l) => l.status === "In Office" || l.status === "Incumbent (Disputed)",
  ).length;
  const avgApproval = Math.round(
    LEADERS.filter((l) => l.approvalRating !== null).reduce(
      (a, l) => a + (l.approvalRating ?? 0),
      0,
    ) / LEADERS.filter((l) => l.approvalRating !== null).length,
  );

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-secondary/20 rounded-lg">
            <Lectern size={26} weight="fill" className="text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              World Leaders
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              In-depth profiles: background, education, political views,
              achievements, and approval ratings
            </p>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Leaders Profiled",
              value: String(LEADERS.length),
              color: "text-secondary",
            },
            {
              label: "Currently in Office",
              value: String(inOffice),
              color: "text-green-400",
            },
            {
              label: "Avg Approval Rating",
              value: `${avgApproval}%`,
              color: "text-yellow-400",
            },
            {
              label: "Regions Covered",
              value: String(REGIONS.length - 1),
              color: "text-purple-400",
            },
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

        {/* Unified Search + Filter Bar — two-row, matches CountriesPage layout */}
        <div className="flex flex-col bg-card border border-border/60 rounded-2xl px-4 py-2.5 mb-6 w-full">
          {/* Row 1: Search */}
          <div className="flex items-center gap-2">
            <MagnifyingGlass
              size={16}
              className="text-muted-foreground shrink-0"
            />
            <input
              type="text"
              placeholder="Search leaders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: Region pills + divider + ideology select */}
          <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-border/60">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  region === r
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {r === "All Regions" ? "All" : r}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            <select
              value={ideology}
              onChange={(e) => setIdeology(e.target.value)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              {ideologies.map((i) => (
                <option key={i} value={i}>
                  {i === "All" ? "Filter: Ideology" : i}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${viewMode === "list" ? "bg-secondary/20 text-secondary border-secondary/40" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
          >
            <ListBullets
              size={13}
              weight={viewMode === "list" ? "fill" : "regular"}
            />
            Leader List
          </button>
          <button
            onClick={() => setViewMode("compass")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${viewMode === "compass" ? "bg-secondary/20 text-secondary border-secondary/40" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
          >
            <Compass
              size={13}
              weight={viewMode === "compass" ? "fill" : "regular"}
            />
            Political Compass
          </button>
          {viewMode === "compass" && (
            <span className="text-xs text-muted-foreground ml-1">
              Showing {filtered.filter((l) => COMPASS_DATA[l.id]).length}{" "}
              leaders with compass data
            </span>
          )}
        </div>

        {/* Political Compass View */}
        {viewMode === "compass" && (
          <div className="mb-6">
            <PoliticalCompass
              leaders={filtered}
              onSelect={(l) => {
                setSelected(l);
              }}
            />
          </div>
        )}

        {/* Card grid */}
        {viewMode === "list" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full bg-card border border-border rounded-xl p-8 text-center">
                <Warning
                  size={28}
                  className="text-muted-foreground mx-auto mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No leaders match your filters
                </p>
              </div>
            ) : (
              filtered.map((l) => (
                <LeaderCard
                  key={l.id}
                  leader={l}
                  onClick={() => setSelected(l)}
                  isSelected={selected?.id === l.id}
                />
              ))
            )}
          </div>
        )}

        {/* Modal overlay */}
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelected(null);
            }}
          >
            <div className="relative w-full max-w-2xl">
              <LeaderDetail
                leader={selected}
                onClose={() => setSelected(null)}
              />
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground font-sans text-center">
            Profiles compiled from public records, official biographies, and
            verified news sources. Approval ratings from major polling
            aggregators as of 2025.
          </p>
          <SourceLink
            sources={[
              { label: "Wikipedia", url: "https://www.wikipedia.org/" },
              {
                label: "Morning Consult Global Leader Approval",
                url: "https://morningconsult.com/global-leader-approval/",
              },
              {
                label: "Reuters Leaders Coverage",
                url: "https://www.reuters.com/world/",
              },
              {
                label: "BBC News World Leaders",
                url: "https://www.bbc.com/news/world",
              },
              {
                label: "CFR World Leaders",
                url: "https://www.cfr.org/global-conflict-tracker",
              },
              {
                label: "UN Member States",
                url: "https://www.un.org/en/about-us/member-states",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
