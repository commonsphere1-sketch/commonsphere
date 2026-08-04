import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  Leaf,
  Warning,
  Info,
  ArrowRight,
  CaretDown,
  CaretUp,
  Globe,
  Drop,
  Wind,
  Atom,
  Fish,
  Tree,
  CloudSlash,
  Snowflake,
  Flask,
} from "@phosphor-icons/react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type BoundaryStatus = "safe" | "increasing_risk" | "high_risk" | "unknown";

interface Boundary {
  id: string;
  name: string;
  shortName: string;
  angleStart: number; // degrees, clockwise from top
  angleSpan: number;
  status: BoundaryStatus;
  value: number; // 0–1 where 1 = safe operating space boundary
  variables: { name: string; value: string; safe: string; unit: string }[];
  geopoliticalLinks: { title: string; detail: string; color: string }[];
  ecologicalFacts: string[];
  icon: React.ReactNode;
  color: string;
  summary: string;
  source: string;
}

/* ─── Data ──────────────────────────────────────────────────────────────── */
const BOUNDARIES: Boundary[] = [
  {
    id: "climate",
    name: "Climate Change",
    shortName: "Climate",
    angleStart: 320,
    angleSpan: 40,
    status: "high_risk",
    value: 1.45,
    icon: <CloudSlash size={16} weight="fill" />,
    color: "#ef4444",
    summary:
      "CO₂ concentration and radiative forcing have breached safe limits. The 2°C threshold is at serious risk by 2040 under current trajectories.",
    source: "IPCC AR6 / Rockström et al. 2023",
    variables: [
      {
        name: "CO₂ Concentration",
        value: "424 ppm",
        safe: "350 ppm",
        unit: "ppm",
      },
      {
        name: "Radiative Forcing",
        value: "+2.91 W/m²",
        safe: "+1.0 W/m²",
        unit: "W/m²",
      },
      {
        name: "Global Mean Temp Rise",
        value: "+1.45°C",
        safe: "<1.5°C",
        unit: "°C",
      },
    ],
    geopoliticalLinks: [
      {
        title: "Paris Agreement Compliance",
        detail:
          "Only 16% of G20 members are on track to meet 2030 NDC targets, creating sovereign liability risks.",
        color: "#ef4444",
      },
      {
        title: "Climate Finance Gap",
        detail:
          "Developing nations face a $2.4T annual gap in climate adaptation funding, fuelling migration and instability.",
        color: "#f97316",
      },
      {
        title: "Carbon Border Mechanisms",
        detail:
          "EU CBAM and US IRA are restructuring global trade flows and geopolitical alignments around carbon intensity.",
        color: "#f59e0b",
      },
    ],
    ecologicalFacts: [
      "Ocean heat content hit a record high in 2023 for the 14th consecutive year.",
      "Arctic sea ice minimum extent fell to 4.23M km² in Sept 2023 — lowest on record.",
      "Permafrost thaw is releasing methane at accelerating rates, creating a feedback loop beyond human control.",
    ],
  },
  {
    id: "novel_entities",
    name: "Novel Entities",
    shortName: "Novel Entities",
    angleStart: 0,
    angleSpan: 40,
    status: "high_risk",
    value: 1.8,
    icon: <Flask size={16} weight="fill" />,
    color: "#dc2626",
    summary:
      "Plastics, synthetic chemicals, and radioactive materials have no safe operating limit yet defined — but evidence of transgression is strong.",
    source: "Persson et al. Science 2022",
    variables: [
      {
        name: "Plastic Production",
        value: "430 MT/yr",
        safe: "Undefined",
        unit: "MT/yr",
      },
      {
        name: "PFAS Chemicals",
        value: ">10,000 types",
        safe: "0 target",
        unit: "types",
      },
      {
        name: "Industrial Substances",
        value: "350,000+",
        safe: "Undefined",
        unit: "registered",
      },
    ],
    geopoliticalLinks: [
      {
        title: "UN Plastics Treaty",
        detail:
          "175 nations negotiating a legally binding global plastics treaty — petrostate opposition threatens progress.",
        color: "#ef4444",
      },
      {
        title: "Chemical Supply Chains",
        detail:
          "PFAS contamination traced to NATO military bases across 27 countries, creating diplomatic liability.",
        color: "#f97316",
      },
      {
        title: "Hazardous Export Flows",
        detail:
          "75% of global e-waste is illegally exported to developing nations, violating Basel Convention.",
        color: "#f59e0b",
      },
    ],
    ecologicalFacts: [
      "Microplastics have been found in human blood, breast milk, and placentas globally.",
      "Over 10,000 synthetic chemicals flow into natural systems with unknown ecological effects.",
      "PFAS 'forever chemicals' persist for thousands of years and are now detected in Antarctic ice.",
    ],
  },
  {
    id: "ozone",
    name: "Stratospheric Ozone Depletion",
    shortName: "Ozone Depletion",
    angleStart: 40,
    angleSpan: 40,
    status: "increasing_risk",
    value: 0.82,
    icon: <Atom size={16} weight="fill" />,
    color: "#f59e0b",
    summary:
      "The Montreal Protocol achieved major reductions in ozone-depleting substances, but recovery is incomplete and new threats from nitrous oxide are emerging.",
    source: "UNEP / WMO 2022 Assessment",
    variables: [
      {
        name: "Stratospheric Ozone",
        value: "283 DU",
        safe: ">276 DU",
        unit: "Dobson Units",
      },
      {
        name: "Antarctic Ozone Hole",
        value: "26.4M km²",
        safe: "<10M km²",
        unit: "km²",
      },
      {
        name: "N₂O Concentration",
        value: "336 ppb",
        safe: "272 ppb",
        unit: "ppb",
      },
    ],
    geopoliticalLinks: [
      {
        title: "Montreal Protocol Success",
        detail:
          "Widely regarded as the most successful multilateral environmental agreement — a model for climate governance.",
        color: "#10b981",
      },
      {
        title: "Illegal CFC Production",
        detail:
          "China faced diplomatic pressure over illegal CFC-11 emissions 2012–2019, showing detection/enforcement gaps.",
        color: "#f97316",
      },
      {
        title: "Nitrous Oxide Surge",
        detail:
          "Agricultural N₂O emissions from Brazil, India, and China are the fastest-growing ozone threat.",
        color: "#f59e0b",
      },
    ],
    ecologicalFacts: [
      "Full ozone layer recovery is not expected until 2060–2080 even with current policies.",
      "Each 1% decrease in ozone increases UV-B radiation by ~2%, raising cancer and cataract rates.",
      "The Antarctic ozone hole in 2023 was the largest ever recorded at 26.4 million km².",
    ],
  },
  {
    id: "aerosol",
    name: "Atmospheric Aerosol Loading",
    shortName: "Aerosol Loading",
    angleStart: 80,
    angleSpan: 40,
    status: "increasing_risk",
    value: 0.7,
    icon: <Wind size={16} weight="fill" />,
    color: "#f59e0b",
    summary:
      "Regional aerosol loading from fossil fuel combustion and biomass burning disrupts monsoon systems and precipitation patterns, with severe humanitarian consequences.",
    source: "Andreae et al. / Stockholm Resilience Centre",
    variables: [
      {
        name: "Global AOD (Aerosol Optical Depth)",
        value: "0.22",
        safe: "<0.25",
        unit: "dimensionless",
      },
      {
        name: "S. Asian Regional AOD",
        value: "0.48",
        safe: "<0.30",
        unit: "dimensionless",
      },
      {
        name: "PM2.5 Global Mean",
        value: "32 μg/m³",
        safe: "<10 μg/m³",
        unit: "μg/m³",
      },
    ],
    geopoliticalLinks: [
      {
        title: "India-Pakistan Smog Diplomacy",
        detail:
          "Transboundary air pollution from crop burning in Punjab creates bilateral health crises each winter.",
        color: "#f97316",
      },
      {
        title: "China's Clean Air Progress",
        detail:
          "China cut PM2.5 levels 57% (2013–2023) — the most ambitious air quality programme in history.",
        color: "#10b981",
      },
      {
        title: "Monsoon Disruption Risks",
        detail:
          "Aerosol forcing is altering South Asian monsoons, threatening food security for 1.5B people.",
        color: "#ef4444",
      },
    ],
    ecologicalFacts: [
      "Aerosols from biomass burning in the Amazon travel 10,000+ km, affecting West African rainfall.",
      "Black carbon deposition on Himalayan glaciers accelerates melt by 24%, threatening river flows.",
      "Air pollution kills 7 million people annually — making it the world's largest environmental health risk.",
    ],
  },
  {
    id: "ocean",
    name: "Ocean Acidification",
    shortName: "Ocean Acidification",
    angleStart: 120,
    angleSpan: 40,
    status: "increasing_risk",
    value: 0.75,
    icon: <Drop size={16} weight="fill" />,
    color: "#f59e0b",
    summary:
      "Ocean pH has decreased by 0.11 units since pre-industrial times — a 30% increase in acidity. Coral reef ecosystems face existential threat.",
    source: "IPCC SROCC / Orr et al.",
    variables: [
      {
        name: "Mean Ocean pH",
        value: "8.08",
        safe: "≥8.17 (≤80% saturation)",
        unit: "pH units",
      },
      {
        name: "Aragonite Saturation",
        value: "2.73 Ω",
        safe: "≥2.75 Ω",
        unit: "Ω",
      },
      {
        name: "Absorption Rate",
        value: "26% of CO₂",
        safe: "Historical baseline",
        unit: "% atmospheric CO₂",
      },
    ],
    geopoliticalLinks: [
      {
        title: "Small Island States",
        detail:
          "Pacific SIDS (Small Island Developing States) face dual existential threats of sea-level rise and reef collapse.",
        color: "#ef4444",
      },
      {
        title: "Fisheries Conflicts",
        detail:
          "Acidification-driven fish stock collapses are intensifying EEZ disputes in the South China Sea and Arctic.",
        color: "#f97316",
      },
      {
        title: "Blue Carbon Diplomacy",
        detail:
          "Coastal nations are increasingly asserting mangrove and seagrass carbon sequestration as sovereign assets.",
        color: "#3b82f6",
      },
    ],
    ecologicalFacts: [
      "At current rates, 90% of coral reefs will experience bleaching-level stress annually by 2050.",
      "Pteropods (sea butterflies), base of the Arctic food web, are dissolving in increasingly acidic polar waters.",
      "Oyster larvae survival dropped 40% in Pacific Northwest hatcheries directly attributable to pH change.",
    ],
  },
  {
    id: "biogeochemical",
    name: "Biogeochemical Flows",
    shortName: "Biogeochem. Flows",
    angleStart: 160,
    angleSpan: 40,
    status: "high_risk",
    value: 2.1,
    icon: <Leaf size={16} weight="fill" />,
    color: "#ef4444",
    summary:
      "Nitrogen and phosphorus cycles are severely disrupted by industrial agriculture. Reactive nitrogen loading is ~4x the safe boundary.",
    source: "Steffen et al. Science 2015 / Rockström 2023",
    variables: [
      {
        name: "Reactive Nitrogen Flow",
        value: "150 Tg N/yr",
        safe: "62 Tg N/yr",
        unit: "Tg N/yr",
      },
      {
        name: "Phosphorus Flow to Ocean",
        value: "22 Tg P/yr",
        safe: "11 Tg P/yr",
        unit: "Tg P/yr",
      },
      {
        name: "Fertiliser N lost to environment",
        value: "~80%",
        safe: "<30%",
        unit: "%",
      },
    ],
    geopoliticalLinks: [
      {
        title: "Dead Zone Proliferation",
        detail:
          "Over 500 oceanic dead zones (hypoxic areas) have been documented, threatening fisheries in sovereign EEZs worldwide.",
        color: "#ef4444",
      },
      {
        title: "Phosphorus Geopolitics",
        detail:
          "Morocco controls 70%+ of global phosphate rock reserves — making it a strategic food security chokepoint.",
        color: "#f97316",
      },
      {
        title: "Nitrogen Policy Failures",
        detail:
          "EU Nitrates Directive compliance remains below 50% in key agricultural states; enforcement is politically contentious.",
        color: "#f59e0b",
      },
    ],
    ecologicalFacts: [
      "The Gulf of Mexico dead zone covers ~6,000–7,000 mi² annually from Mississippi River nitrogen runoff.",
      "Biological nitrogen fixation capacity is being overwhelmed by synthetic fertiliser inputs by a ratio of 5:1.",
      "Phosphorus reserves at current extraction rates will be depleted in 50–100 years — no substitute exists.",
    ],
  },
  {
    id: "freshwater",
    name: "Freshwater Change",
    shortName: "Freshwater",
    angleStart: 200,
    angleSpan: 40,
    status: "high_risk",
    value: 1.3,
    icon: <Drop size={16} weight="fill" />,
    color: "#ef4444",
    summary:
      "Blue water (rivers/lakes) and green water (soil moisture) boundaries are both transgressed. 3.6 billion people already face water scarcity.",
    source: "Wang-Erlandsson et al. Nature Reviews 2022",
    variables: [
      {
        name: "Blue Water Consumption",
        value: "2,600 km³/yr",
        safe: "1,000–4,000 km³/yr",
        unit: "km³/yr",
      },
      {
        name: "Green Water (soil moisture dev.)",
        value: "+11.3%",
        safe: "<±10%",
        unit: "% deviation",
      },
      {
        name: "River flow alteration",
        value: ">50% of major rivers",
        safe: "<25%",
        unit: "% affected",
      },
    ],
    geopoliticalLinks: [
      {
        title: "Transboundary River Disputes",
        detail:
          "The Nile, Mekong, and Indus basins are active flashpoints as upstream damming reduces downstream flows.",
        color: "#ef4444",
      },
      {
        title: "Aquifer Depletion Crises",
        detail:
          "The Arabian Aquifer (shared by Saudi Arabia, Yemen, Oman) is non-renewable and projected to be exhausted by 2100.",
        color: "#f97316",
      },
      {
        title: "Water-Food-Energy Nexus",
        detail:
          "Pakistan, India, and Egypt face cascading water-agriculture failures that Western risk models systematically underestimate.",
        color: "#f59e0b",
      },
    ],
    ecologicalFacts: [
      "Lake Chad shrank by 90% between 1960 and 2000, contributing to Boko Haram insurgency dynamics.",
      "The Colorado River no longer reaches the sea — for the first time in recorded history — due to agricultural extraction.",
      "Groundwater depletion is now detectable from space via GRACE satellite gravity measurements.",
    ],
  },
  {
    id: "land",
    name: "Land System Change",
    shortName: "Land System",
    angleStart: 240,
    angleSpan: 40,
    status: "high_risk",
    value: 1.2,
    icon: <Tree size={16} weight="fill" />,
    color: "#ef4444",
    summary:
      "Global forest cover loss, driven by agriculture and urbanisation, has crossed the boundary. Tropical deforestation remains the critical concern.",
    source: "Hansen et al. / Global Forest Watch 2023",
    variables: [
      {
        name: "Forest Area (% of original)",
        value: "67%",
        safe: ">75%",
        unit: "%",
      },
      {
        name: "Tropical Forest Loss (2023)",
        value: "3.7M ha",
        safe: "<2M ha/yr",
        unit: "ha/yr",
      },
      {
        name: "Land converted to agriculture",
        value: "50% of ice-free land",
        safe: "<40%",
        unit: "% land",
      },
    ],
    geopoliticalLinks: [
      {
        title: "Amazon Sovereignty Tensions",
        detail:
          "Brazil's assertion of sovereignty over Amazonian land use clashes directly with EU deforestation regulations.",
        color: "#ef4444",
      },
      {
        title: "Congo Basin Politics",
        detail:
          "The DRC holds the world's second-largest tropical forest. Governance collapse is the primary deforestation driver.",
        color: "#f97316",
      },
      {
        title: "Land Grabbing",
        detail:
          "Foreign land acquisitions ('land grabs') in Sub-Saharan Africa and SE Asia disproportionately target Indigenous territories.",
        color: "#f59e0b",
      },
    ],
    ecologicalFacts: [
      "Deforestation contributes ~10% of global annual CO₂ emissions — equivalent to all global transport combined.",
      "The Amazon is approaching a 'tipping point' at 20–25% deforestation where dieback becomes self-sustaining.",
      "50% of all terrestrial biodiversity depends on forests; habitat loss drives 68% of vertebrate population declines.",
    ],
  },
  {
    id: "biosphere",
    name: "Biosphere Integrity",
    shortName: "Biosphere Integrity",
    angleStart: 280,
    angleSpan: 40,
    status: "high_risk",
    value: 2.3,
    icon: <Fish size={16} weight="fill" />,
    color: "#dc2626",
    summary:
      "Biodiversity loss is accelerating at 10–100x natural background rates. Functional biosphere integrity — the loss of ecological roles — may be the most dangerous boundary crossed.",
    source: "Leclère et al. Nature 2020 / IPBES 2022",
    variables: [
      {
        name: "Species Extinction Rate",
        value: ">100/million species·yr",
        safe: "<10/million species·yr",
        unit: "E/MSY",
      },
      {
        name: "Mean Species Abundance",
        value: "68% of 1970 baseline",
        safe: ">90%",
        unit: "%",
      },
      {
        name: "Functional Diversity Loss",
        value: "High transgression",
        safe: "Undefined",
        unit: "qualitative",
      },
    ],
    geopoliticalLinks: [
      {
        title: "Kunming-Montreal Agreement",
        detail:
          "196 governments adopted the 30×30 target (30% land/ocean protected by 2030) — but implementation financing gaps persist.",
        color: "#10b981",
      },
      {
        title: "Biopiracy & IP",
        detail:
          "Genetic resources from megadiverse nations (Brazil, Indonesia, India) are extracted without benefit-sharing under Nagoya Protocol.",
        color: "#f97316",
      },
      {
        title: "Sixth Mass Extinction",
        detail:
          "Wildlife population declines tracked since 1970 show 69% average reduction — the signature of anthropogenic mass extinction.",
        color: "#ef4444",
      },
    ],
    ecologicalFacts: [
      "1 million species currently face extinction — more than at any point in human history.",
      "Insect populations have declined by 45% globally since 1974, threatening agricultural pollination services worth $577B/yr.",
      "The ocean has lost 50% of its coral coverage and 90% of large predatory fish since industrialisation.",
    ],
  },
];

/* ─── Status helpers ─────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<
  BoundaryStatus,
  { label: string; color: string; ring: string; bg: string }
> = {
  safe: {
    label: "Safe Zone",
    color: "#22c55e",
    ring: "#22c55e40",
    bg: "#22c55e10",
  },
  increasing_risk: {
    label: "Zone of Uncertainty",
    color: "#f59e0b",
    ring: "#f59e0b40",
    bg: "#f59e0b10",
  },
  high_risk: {
    label: "High Risk / Transgressed",
    color: "#ef4444",
    ring: "#ef444440",
    bg: "#ef444410",
  },
  unknown: {
    label: "Not Quantified",
    color: "#6366f1",
    ring: "#6366f140",
    bg: "#6366f110",
  },
};

/* ─── Radial Chart Component ─────────────────────────────────────────────── */
function PlanetaryBoundariesRadialChart({
  boundaries,
  selected,
  onSelect,
  isLight,
}: {
  boundaries: Boundary[];
  selected: string | null;
  onSelect: (id: string) => void;
  isLight: boolean;
}) {
  const cx = 260;
  const cy = 260;
  const innerR = 72; // safe operating space boundary
  const outerMaxR = 200; // max visual outer radius (fully transgressed)
  const outerBoundaryR = 130; // the safe operating space edge visually

  function polarToXY(angleDeg: number, r: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(
    startAngle: number,
    endAngle: number,
    inner: number,
    outer: number,
  ): string {
    const gap = 1.5; // degrees gap between segments
    const s = startAngle + gap / 2;
    const e = endAngle - gap / 2;

    const p1 = polarToXY(s, inner);
    const p2 = polarToXY(s, outer);
    const p3 = polarToXY(e, outer);
    const p4 = polarToXY(e, inner);

    const largeArc = e - s > 180 ? 1 : 0;
    return [
      `M ${p1.x} ${p1.y}`,
      `L ${p2.x} ${p2.y}`,
      `A ${outer} ${outer} 0 ${largeArc} 1 ${p3.x} ${p3.y}`,
      `L ${p4.x} ${p4.y}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${p1.x} ${p1.y}`,
      "Z",
    ].join(" ");
  }

  function labelPosition(b: Boundary) {
    const midAngle = b.angleStart + b.angleSpan / 2;
    const r = outerMaxR + 30;
    return polarToXY(midAngle, r);
  }

  function iconPosition(b: Boundary) {
    const midAngle = b.angleStart + b.angleSpan / 2;
    const r = outerMaxR + 14;
    return polarToXY(midAngle, r);
  }

  const safeColor = "#22c55e";
  const warnColor = "#f59e0b";
  const riskColor = "#ef4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 520 520"
        width="100%"
        style={{ maxWidth: 520, overflow: "visible" }}
        aria-label="Planetary Boundaries radial chart"
      >
        <defs>
          <radialGradient id="pbCoreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
            <stop offset="60%" stopColor="#16a34a" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#14532d" stopOpacity={0.5} />
          </radialGradient>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ring zones */}
        {/* Safe zone fill */}
        <circle
          cx={cx}
          cy={cy}
          r={outerBoundaryR}
          fill={isLight ? "#f0fdf4" : "#052e16"}
          opacity={0.4}
        />
        {/* Uncertainty zone ring */}
        <circle
          cx={cx}
          cy={cy}
          r={outerMaxR}
          fill="none"
          stroke={warnColor}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.25}
        />
        {/* Safe boundary ring */}
        <circle
          cx={cx}
          cy={cy}
          r={outerBoundaryR}
          fill="none"
          stroke={safeColor}
          strokeWidth={1.5}
          strokeDasharray="3 3"
          opacity={0.4}
        />

        {/* Segment fills */}
        {boundaries.map((b) => {
          const endAngle = b.angleStart + b.angleSpan;

          // Background segment (full extent)
          const bgPath = describeArc(b.angleStart, endAngle, innerR, outerMaxR);
          // Value segment (proportional to how deep into the boundary it is)
          const clampedVal = Math.min(b.value, 1.8);
          const segOuter =
            innerR + (outerMaxR - innerR) * Math.min(clampedVal / 1.8, 1);
          const valPath = describeArc(b.angleStart, endAngle, innerR, segOuter);
          const isSelected = selected === b.id;

          return (
            <g key={b.id}>
              {/* Background */}
              <path
                d={bgPath}
                fill={b.color}
                opacity={0.06}
                className="transition-all duration-300"
              />
              {/* Value fill */}
              <path
                d={valPath}
                fill={b.color}
                opacity={isSelected ? 0.85 : 0.55}
                className="cursor-pointer transition-all duration-300"
                onClick={() => onSelect(b.id)}
                style={{
                  filter: isSelected
                    ? `drop-shadow(0 0 8px ${b.color}80)`
                    : undefined,
                }}
              />
              {/* Hover/select outline */}
              <path
                d={describeArc(b.angleStart, endAngle, innerR, outerMaxR)}
                fill="none"
                stroke={isSelected ? b.color : "transparent"}
                strokeWidth={isSelected ? 2 : 0}
                className="pointer-events-none transition-all duration-300"
              />
              {/* Clickable overlay */}
              <path
                d={describeArc(b.angleStart, endAngle, innerR, outerMaxR)}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelect(b.id)}
              />
            </g>
          );
        })}

        {/* Safe zone inner circle (the "Earth" core) */}
        <circle cx={cx} cy={cy} r={innerR} fill="url(#pbCoreGrad)" />
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill="none"
          stroke="#22c55e"
          strokeWidth={2}
          opacity={0.6}
        />

        {/* Center text */}
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fontSize="9"
          fontFamily="monospace"
          fill={isLight ? "#166534" : "#86efac"}
          opacity={0.85}
          letterSpacing="1"
        >
          SAFE
        </text>
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          fontSize="9"
          fontFamily="monospace"
          fill={isLight ? "#166534" : "#86efac"}
          opacity={0.85}
          letterSpacing="1"
        >
          OPERATING
        </text>
        <text
          x={cx}
          y={cy + 15}
          textAnchor="middle"
          fontSize="9"
          fontFamily="monospace"
          fill={isLight ? "#166534" : "#86efac"}
          opacity={0.85}
          letterSpacing="1"
        >
          SPACE
        </text>

        {/* Boundary ring label */}
        <text
          x={cx + outerBoundaryR + 4}
          y={cy - 2}
          fontSize="7"
          fontFamily="monospace"
          fill={safeColor}
          opacity={0.7}
        >
          boundary
        </text>

        {/* Outer labels */}
        {boundaries.map((b) => {
          const midAngle = b.angleStart + b.angleSpan / 2;
          const lp = labelPosition(b);
          const ip = iconPosition(b);
          const isSelected = selected === b.id;
          // Text anchor based on angle
          const anchor =
            midAngle > 315 || midAngle < 45
              ? "middle"
              : midAngle < 180
                ? "start"
                : midAngle > 180
                  ? "end"
                  : "middle";

          // Short label lines
          const words = b.shortName.split(" ");
          const lineHeight = 11;
          const startY = lp.y - ((words.length - 1) * lineHeight) / 2;

          return (
            <g
              key={`lbl-${b.id}`}
              onClick={() => onSelect(b.id)}
              className="cursor-pointer"
            >
              {words.map((word, wi) => (
                <text
                  key={wi}
                  x={lp.x}
                  y={startY + wi * lineHeight}
                  textAnchor={anchor}
                  fontSize="8.5"
                  fontFamily="sans-serif"
                  fontWeight={isSelected ? "700" : "600"}
                  fill={isSelected ? b.color : isLight ? "#334155" : "#cbd5e1"}
                  opacity={isSelected ? 1.0 : 0.8}
                  className="transition-all duration-200 select-none"
                >
                  {word}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Detail Panel ───────────────────────────────────────────────────────── */
function BoundaryDetailPanel({
  boundary,
  isLight,
  headText,
  mutedText,
  gridLine,
  cardBg,
}: {
  boundary: Boundary;
  isLight: boolean;
  headText: string;
  mutedText: string;
  gridLine: string;
  cardBg: string;
}) {
  const sc = STATUS_CONFIG[boundary.status];

  return (
    <div className="flex flex-col gap-4 animate-fade-in h-full">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: boundary.color + "18", color: boundary.color }}
        >
          {boundary.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-bold font-sans leading-snug"
            style={{ color: headText }}
          >
            {boundary.name}
          </h3>
          <span
            className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: sc.bg, color: sc.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: sc.color }}
            />
            {sc.label}
          </span>
        </div>
      </div>

      {/* Summary */}
      <p
        className="text-[11px] font-sans leading-relaxed"
        style={{ color: isLight ? "#475569" : "#94a3b8" }}
      >
        {boundary.summary}
      </p>

      {/* Key Variables */}
      <div>
        <p
          className="text-[9px] font-mono uppercase tracking-widest mb-2"
          style={{ color: mutedText }}
        >
          Key Variables
        </p>
        <div className="flex flex-col gap-2">
          {boundary.variables.map((v) => {
            const exceeded =
              v.safe !== "Undefined" && v.safe !== "Historical baseline";
            return (
              <div
                key={v.name}
                className="rounded-lg px-3 py-2.5"
                style={{
                  background: isLight
                    ? "rgba(0,0,0,0.025)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${gridLine}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-sans font-semibold"
                    style={{ color: headText }}
                  >
                    {v.name}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <div>
                    <p
                      className="text-[9px] font-mono"
                      style={{ color: mutedText }}
                    >
                      Current
                    </p>
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: boundary.color }}
                    >
                      {v.value}
                    </p>
                  </div>
                  <ArrowRight size={10} style={{ color: mutedText }} />
                  <div className="text-right">
                    <p
                      className="text-[9px] font-mono"
                      style={{ color: mutedText }}
                    >
                      Safe level
                    </p>
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: "#22c55e" }}
                    >
                      {v.safe}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ecological Facts */}
      <div>
        <p
          className="text-[9px] font-mono uppercase tracking-widest mb-2"
          style={{ color: mutedText }}
        >
          Ecological Context
        </p>
        <div className="flex flex-col gap-2">
          {boundary.ecologicalFacts.map((fact, i) => (
            <div key={i} className="flex gap-2.5">
              <div
                className="w-1 rounded-full shrink-0 mt-1"
                style={{ background: boundary.color, minHeight: 14 }}
              />
              <p
                className="text-[11px] font-sans leading-relaxed"
                style={{ color: isLight ? "#475569" : "#94a3b8" }}
              >
                {fact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Geopolitical Links */}
      <div>
        <p
          className="text-[9px] font-mono uppercase tracking-widest mb-2"
          style={{ color: mutedText }}
        >
          Geopolitical Dimensions
        </p>
        <div className="flex flex-col gap-2">
          {boundary.geopoliticalLinks.map((link, i) => (
            <div
              key={i}
              className="rounded-xl p-3"
              style={{
                background: link.color + "08",
                border: `1px solid ${link.color}20`,
              }}
            >
              <p
                className="text-[11px] font-bold font-sans mb-1"
                style={{ color: headText }}
              >
                {link.title}
              </p>
              <p
                className="text-[10px] font-sans leading-relaxed"
                style={{ color: isLight ? "#475569" : "#94a3b8" }}
              >
                {link.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Source */}
      <p className="text-[9px] font-sans" style={{ color: mutedText }}>
        Source: {boundary.source}
      </p>
    </div>
  );
}

/* ─── Summary Card ───────────────────────────────────────────────────────── */
function BoundarySummaryCard({
  boundary,
  selected,
  onSelect,
  isLight,
  headText,
  mutedText,
  gridLine,
}: {
  boundary: Boundary;
  selected: boolean;
  onSelect: () => void;
  isLight: boolean;
  headText: string;
  mutedText: string;
  gridLine: string;
}) {
  const sc = STATUS_CONFIG[boundary.status];
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-left w-full transition-all"
      style={{
        background: selected ? boundary.color + "12" : "transparent",
        border: `1px solid ${selected ? boundary.color + "35" : gridLine}`,
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: boundary.color + "18", color: boundary.color }}
      >
        {boundary.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[11px] font-semibold font-sans truncate"
          style={{ color: headText }}
        >
          {boundary.shortName}
        </p>
        <p className="text-[9px] font-mono" style={{ color: sc.color }}>
          {sc.label}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span
          className="text-[10px] font-mono font-bold"
          style={{ color: boundary.value > 1 ? boundary.color : "#22c55e" }}
        >
          {boundary.value > 1
            ? `×${boundary.value.toFixed(1)}`
            : `${Math.round(boundary.value * 100)}%`}
        </span>
        <p className="text-[8px] font-mono" style={{ color: mutedText }}>
          {boundary.value > 1 ? "of limit" : "of limit"}
        </p>
      </div>
    </button>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export function PlanetaryBoundariesPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedId, setSelectedId] = useState<string>("climate");

  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight ? "0 1px 10px rgba(0,0,0,0.07)" : "none";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  const bodyText = isLight ? "#1e293b" : "#e2e8f0";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const selected = BOUNDARIES.find((b) => b.id === selectedId) ?? BOUNDARIES[0];

  const highRisk = BOUNDARIES.filter((b) => b.status === "high_risk").length;
  const increasing = BOUNDARIES.filter(
    (b) => b.status === "increasing_risk",
  ).length;
  const safe = BOUNDARIES.filter((b) => b.status === "safe").length;

  return (
    <div
      className="min-h-screen w-full animate-fade-in"
      style={{ background: isLight ? "#f8fafc" : "#0b0b14", color: bodyText }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden relative"
          style={{
            background: isLight
              ? "linear-gradient(130deg, #f0fdf4 0%, #dcfce7 40%, #d1fae5 70%, #ecfdf5 100%)"
              : "linear-gradient(130deg, #052e16 0%, #0b0b14 50%, #022c22 100%)",
            border: isLight
              ? "1px solid rgba(34,197,94,0.25)"
              : "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, ${isLight ? "#16a34a" : "#22c55e"} 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Leaf
                size={12}
                weight="fill"
                style={{ color: isLight ? "#16a34a" : "#4ade80" }}
              />
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: isLight ? "#16a34a" : "#4ade80" }}
              >
                Earth System Science · Ecological Boundaries
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold font-sans leading-tight"
              style={{ color: headText }}
            >
              Planetary Boundaries
            </h1>
            <p
              className="text-xs font-sans mt-1 max-w-lg"
              style={{ color: mutedText }}
            >
              The nine processes that regulate the stability and resilience of
              the Earth System. Crossing these boundaries risks destabilising
              the Holocene conditions under which human civilisation developed.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2 shrink-0">
            {[
              { v: `${highRisk}`, l: "Transgressed", col: "#ef4444" },
              { v: `${increasing}`, l: "At Risk", col: "#f59e0b" },
              { v: `${safe}`, l: "Within Limits", col: "#22c55e" },
              {
                v: "2024",
                l: "Data Year",
                col: isLight ? "#0f172a" : "#f1f0ff",
              },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl px-3 py-1.5 text-center"
                style={{
                  background: isLight
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.07)",
                  border: isLight
                    ? "1px solid rgba(34,197,94,0.18)"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <p
                  className="text-sm font-bold font-mono"
                  style={{ color: s.col }}
                >
                  {s.v}
                </p>
                <p
                  className="text-[10px] font-sans"
                  style={{ color: mutedText }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI PILLS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Boundaries Transgressed",
              value: `${highRisk} / 9`,
              color: "#ef4444",
              sub: "As of 2024",
            },
            {
              label: "CO₂ Concentration",
              value: "424 ppm",
              color: "#f97316",
              sub: "Safe: 350 ppm",
            },
            {
              label: "Species Loss Rate",
              value: "100×",
              color: "#dc2626",
              sub: "Natural background",
            },
            {
              label: "Reactive N Loading",
              value: "150 Tg/yr",
              color: "#f59e0b",
              sub: "Limit: 62 Tg/yr",
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl px-5 py-4 flex flex-col gap-1.5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[11px] font-sans uppercase tracking-widest"
                style={{ color: mutedText }}
              >
                {k.label}
              </p>
              <p
                className="text-xl font-bold font-mono"
                style={{ color: k.color }}
              >
                {k.value}
              </p>
              <p className="text-[10px] font-mono" style={{ color: mutedText }}>
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT: Boundary list */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <div
              className="rounded-2xl p-4"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                All Nine Boundaries
              </p>
              <div className="flex flex-col gap-1.5">
                {BOUNDARIES.map((b) => (
                  <BoundarySummaryCard
                    key={b.id}
                    boundary={b}
                    selected={selectedId === b.id}
                    onSelect={() => setSelectedId(b.id)}
                    isLight={isLight}
                    headText={headText}
                    mutedText={mutedText}
                    gridLine={gridLine}
                  />
                ))}
              </div>
            </div>

            {/* Legend */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                Legend
              </p>
              <div className="flex flex-col gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: cfg.color }}
                    />
                    <span
                      className="text-[10px] font-sans"
                      style={{ color: headText }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="mt-3 pt-3 text-[10px] font-sans leading-relaxed"
                style={{ borderTop: `1px solid ${gridLine}`, color: mutedText }}
              >
                The inner green circle represents the Safe Operating Space.
                Segments extending beyond the dashed boundary line indicate
                transgression.
              </div>
            </div>
          </div>

          {/* CENTER: Radial Chart */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div
              className="rounded-2xl p-4 flex flex-col"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p
                    className="text-[10px] font-mono uppercase tracking-widest"
                    style={{ color: isLight ? "#16a34a" : "#4ade80" }}
                  >
                    Earth System Status
                  </p>
                  <h2
                    className="text-sm font-bold font-sans"
                    style={{ color: headText }}
                  >
                    Planetary Boundaries Dashboard
                  </h2>
                </div>
                <span
                  className="text-[9px] font-mono px-2 py-1 rounded-full"
                  style={{ background: "#ef444415", color: "#ef4444" }}
                >
                  {highRisk} of 9 exceeded
                </span>
              </div>
              <PlanetaryBoundariesRadialChart
                boundaries={BOUNDARIES}
                selected={selectedId}
                onSelect={setSelectedId}
                isLight={isLight}
              />
              <p
                className="text-[10px] font-sans mt-2 text-center"
                style={{ color: mutedText }}
              >
                Click any segment to explore data. Red = transgressed, amber =
                increasing risk, green = within limits.
              </p>
            </div>

            {/* Geopolitical Matrix */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#16a34a" : "#4ade80" }}
              >
                Geopolitical Risk Matrix
              </p>
              <h2
                className="text-sm font-bold font-sans mb-4"
                style={{ color: headText }}
              >
                Boundaries ↔ Global Security Linkages
              </h2>
              <div className="flex flex-col gap-0">
                {[
                  {
                    boundary: "Climate Change",
                    risk: "Migration, resource wars, coastal state inundation",
                    severity: 95,
                    color: "#ef4444",
                  },
                  {
                    boundary: "Biosphere Integrity",
                    risk: "Food system collapse, zoonotic pandemic risk",
                    severity: 88,
                    color: "#dc2626",
                  },
                  {
                    boundary: "Biogeochemical Flows",
                    risk: "Agricultural failure, water disputes, famine",
                    severity: 82,
                    color: "#ef4444",
                  },
                  {
                    boundary: "Freshwater Change",
                    risk: "Transboundary conflict, state fragility",
                    severity: 79,
                    color: "#f97316",
                  },
                  {
                    boundary: "Land System Change",
                    risk: "Sovereignty disputes, deforestation diplomacy",
                    severity: 73,
                    color: "#f97316",
                  },
                  {
                    boundary: "Novel Entities",
                    risk: "Chemical weapons precedents, regulatory failures",
                    severity: 68,
                    color: "#f59e0b",
                  },
                  {
                    boundary: "Ocean Acidification",
                    risk: "Fisheries EEZ conflicts, SIDS existential threat",
                    severity: 64,
                    color: "#f59e0b",
                  },
                  {
                    boundary: "Ozone Depletion",
                    risk: "Moderate — Montreal Protocol partially effective",
                    severity: 42,
                    color: "#22c55e",
                  },
                  {
                    boundary: "Aerosol Loading",
                    risk: "Transboundary air pollution disputes",
                    severity: 55,
                    color: "#f59e0b",
                  },
                ].map((row, i) => (
                  <div
                    key={row.boundary}
                    className="flex items-center gap-3 py-2.5"
                    style={{
                      borderBottom: i < 8 ? `1px solid ${gridLine}` : "none",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: row.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[11px] font-semibold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {row.boundary}
                      </p>
                      <p
                        className="text-[9px] font-sans truncate"
                        style={{ color: mutedText }}
                      >
                        {row.risk}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className="w-14 h-1.5 rounded-full overflow-hidden"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.07)"
                            : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${row.severity}%`,
                            background: row.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-[9px] font-mono w-6 text-right"
                        style={{ color: row.color }}
                      >
                        {row.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p
                className="text-[10px] font-sans mt-3"
                style={{ color: mutedText }}
              >
                Security index reflects geopolitical instability risk per
                boundary. Composite of expert consensus and conflict literature.
              </p>
            </div>
          </div>

          {/* RIGHT: Detail panel */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div
              className="rounded-2xl p-5 flex-1 overflow-y-auto"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                maxHeight: "calc(100vh - 180px)",
              }}
            >
              <BoundaryDetailPanel
                boundary={selected}
                isLight={isLight}
                headText={headText}
                mutedText={mutedText}
                gridLine={gridLine}
                cardBg={cardBg}
              />
            </div>

            {/* Science Note */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: isLight
                  ? "rgba(34,197,94,0.05)"
                  : "rgba(34,197,94,0.07)",
                border: isLight
                  ? "1px solid rgba(34,197,94,0.18)"
                  : "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <div className="flex items-start gap-2.5">
                <Info
                  size={14}
                  weight="fill"
                  style={{
                    color: isLight ? "#16a34a" : "#4ade80",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                />
                <div>
                  <p
                    className="text-[11px] font-bold font-sans mb-1"
                    style={{ color: isLight ? "#15803d" : "#4ade80" }}
                  >
                    About Planetary Boundaries
                  </p>
                  <p
                    className="text-[10px] font-sans leading-relaxed"
                    style={{ color: mutedText }}
                  >
                    Framework introduced by Johan Rockström and colleagues in
                    2009 (Nature). Updated in 2015 (Science) and 2023. As of
                    2024, six of nine boundaries are transgressed. Biosphere
                    integrity and novel entities are most severely exceeded.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ECOLOGICAL TRENDS SECTION ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            {
              title: "Tipping Points & Cascades",
              items: [
                {
                  label: "Amazon Dieback",
                  val: "~20–25% deforestation threshold",
                  color: "#ef4444",
                },
                {
                  label: "West Antarctic Ice Sheet",
                  val: "Potential 3.3m sea-level rise",
                  color: "#3b82f6",
                },
                {
                  label: "Atlantic AMOC Slowdown",
                  val: "Increased 15% slowing since 1950",
                  color: "#6366f1",
                },
                {
                  label: "Greenland Ice Sheet",
                  val: "1.5–2°C tipping point suspected",
                  color: "#06b6d4",
                },
                {
                  label: "Coral Reef Collapse",
                  val: "90% reefs stressed by 2050 at 1.5°C",
                  color: "#f97316",
                },
              ],
            },
            {
              title: "International Treaties & Gaps",
              items: [
                {
                  label: "Paris Agreement",
                  val: "196 parties — 16% on track for 2030",
                  color: "#f59e0b",
                },
                {
                  label: "Kunming-Montreal (30×30)",
                  val: "196 parties — financing gap ~$700B/yr",
                  color: "#10b981",
                },
                {
                  label: "Global Plastics Treaty",
                  val: "Negotiations ongoing — 175 nations",
                  color: "#f97316",
                },
                {
                  label: "High Seas Treaty (BBNJ)",
                  val: "88 signatures — not yet in force",
                  color: "#3b82f6",
                },
                {
                  label: "Nagoya Protocol",
                  val: "137 parties — enforcement weak",
                  color: "#a855f7",
                },
              ],
            },
            {
              title: "Ecological Security Flashpoints",
              items: [
                {
                  label: "Nile Basin (Ethiopia–Egypt)",
                  val: "GERD dam — existential water conflict",
                  color: "#ef4444",
                },
                {
                  label: "Lancang-Mekong Corridor",
                  val: "China upstream damming — SEA tensions",
                  color: "#f97316",
                },
                {
                  label: "Amazon Governance",
                  val: "Brazil sovereignty vs. EU EUDR pressure",
                  color: "#22c55e",
                },
                {
                  label: "Arctic Resources",
                  val: "Melting opens new sovereignty/military disputes",
                  color: "#06b6d4",
                },
                {
                  label: "Pacific SIDS Inundation",
                  val: "Nation-state extinction risk — legal precedents",
                  color: "#6366f1",
                },
              ],
            },
          ].map((section) => (
            <div
              key={section.title}
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                {section.title}
              </p>
              <div className="flex flex-col gap-0">
                {section.items.map((item, i) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-2.5 py-2.5"
                    style={{
                      borderBottom:
                        i < section.items.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                      style={{ background: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[11px] font-semibold font-sans"
                        style={{ color: headText }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="text-[10px] font-sans"
                        style={{ color: mutedText }}
                      >
                        {item.val}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div className="text-center py-3">
          <p className="text-[11px] font-sans" style={{ color: mutedText }}>
            © {new Date().getFullYear()} CommonSphere · Planetary Boundaries ·
            Sources: Rockström et al., IPCC, IPBES, Stockholm Resilience Centre
          </p>
        </div>
      </div>
    </div>
  );
}
