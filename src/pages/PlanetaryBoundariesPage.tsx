import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  Leaf,
  Info,
  ArrowRight,
  Globe,
  Drop,
  Wind,
  Atom,
  Fish,
  Tree,
  CloudSlash,
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
        // Was 424 ppm here while the summary card said 428 — the same page
        // carried two different figures. Both now use the NOAA Mauna Loa
        // monthly mean for July 2026.
        value: "429 ppm",
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
        style={{ maxWidth: 680, overflow: "visible" }}
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
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-left w-full transition-all hover:opacity-90"
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.background =
            boundary.color + "0d";
          (e.currentTarget as HTMLButtonElement).style.border =
            `1px solid ${boundary.color}30`;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
          (e.currentTarget as HTMLButtonElement).style.border =
            `1px solid ${gridLine}`;
        }
      }}
      style={{
        background: selected ? boundary.color + "12" : "transparent",
        border: `1px solid ${selected ? boundary.color + "35" : gridLine}`,
        outline: "none",
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
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* ── HERO HEADER ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Planetary Boundaries
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              Nine Earth-system processes that define the safe operating space
              for humanity
            </p>
          </div>
        </div>

        {/* ── KPI STRIP ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Boundaries Transgressed",
              value: `${highRisk} / 9`,
              color: "text-red-500",
              sub: "As of 2026",
            },
            {
              label: "CO₂ Concentration",
              // NOAA Mauna Loa monthly mean, July 2026 (429.12 ppm), from
              // gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt. Was 428
              // with no date. The series is not fetchable from the browser —
              // NOAA sends no CORS header — so it is cited rather than live.
              value: "429 ppm",
              color: "text-orange-500",
              sub: "Safe: 350 ppm · Jul 2026",
            },
            {
              label: "Species Loss Rate",
              value: "100×",
              color: "text-red-600",
              sub: "Natural background",
            },
            {
              label: "Reactive N Loading",
              value: "152 Tg/yr",
              color: "text-amber-500",
              sub: "Limit: 62 Tg/yr",
            },
          ].map((k) => (
            <div
              key={k.label}
              className="bg-card border border-border rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground font-sans">
                {k.label}
              </p>
              <p className={`text-xl font-bold font-mono ${k.color}`}>
                {k.value}
              </p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ─────────────────────────────────────────── */}
        {/* Nine-boundary selector — full width above the chart. It is the
            page's primary control, so it leads; the chart below reflects
            whichever boundary is picked here. */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4 xl:col-span-3">
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3 text-muted-foreground">
              All Nine Boundaries
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3 text-muted-foreground">
              Legend
            </p>
            <div className="flex flex-col gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: cfg.color }}
                  />
                  <span className="text-[10px] font-sans text-foreground">
                    {cfg.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 text-[10px] font-sans leading-relaxed text-muted-foreground border-t border-border">
              The inner green circle represents the Safe Operating Space.
              Segments extending beyond the dashed boundary line indicate
              transgression.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* LEFT: Boundary list */}

          {/* CENTER: Radial Chart */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-green-500">
                    Earth System Status
                  </p>
                  <h2 className="text-sm font-bold font-sans text-foreground">
                    Planetary Boundaries Dashboard
                  </h2>
                </div>
                <span className="text-[9px] font-mono px-2 py-1 rounded-full bg-red-500/10 text-red-500">
                  {highRisk} of 9 exceeded
                </span>
              </div>
              <PlanetaryBoundariesRadialChart
                boundaries={BOUNDARIES}
                selected={selectedId}
                onSelect={setSelectedId}
                isLight={isLight}
              />
              <p className="text-[10px] font-sans mt-2 text-center text-muted-foreground">
                Click any segment to explore data. Red = transgressed, amber =
                increasing risk, green = within limits.
              </p>
            </div>

            {/* Geopolitical Matrix */}
            <div className="bg-card border border-border rounded-2xl p-5 flex-1">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1 text-green-500">
                Geopolitical Risk Matrix
              </p>
              <h2 className="text-sm font-bold font-sans mb-4 text-foreground">
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
                      <p className="text-[11px] font-semibold font-sans text-foreground">
                        {row.boundary}
                      </p>
                      <p className="text-[9px] font-sans text-muted-foreground">
                        {row.risk}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-14 h-1.5 rounded-full overflow-hidden bg-muted">
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
              <p className="text-[10px] font-sans mt-3 text-muted-foreground">
                Security index reflects geopolitical instability risk per
                boundary. Composite of expert consensus and conflict literature.
              </p>
            </div>
          </div>

          {/* RIGHT: Detail panel */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-card border border-border rounded-2xl p-5">
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
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <Info
                  size={14}
                  weight="fill"
                  className="text-green-500 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-[11px] font-bold font-sans mb-1 text-green-600 dark:text-green-400">
                    About Planetary Boundaries
                  </p>
                  <p className="text-[10px] font-sans leading-relaxed text-muted-foreground">
                    Framework introduced by Johan Rockström and colleagues in
                    2009 (Nature). Updated in 2015 (Science) and 2023. As of
                    2026, six of nine boundaries are transgressed. Biosphere
                    integrity and novel entities are most severely exceeded.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ECOLOGICAL TRENDS SECTION ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
              className="bg-card border border-border rounded-2xl p-5"
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

        {/* ── PUBLIC ENVIRONMENTAL DATA ─────────────────────────────────── */}
        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <Globe size={16} weight="fill" className="text-sky-500" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-sky-500">
            Most Publicly Inquired Environmental Data
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Row 1 — Air Quality + Global Temp + Sea Level */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Air Quality Index — Global Cities */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Air Quality Index
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Major Cities — PM2.5 / AQI 2026
            </h3>
            <div className="flex flex-col gap-0">
              {[
                {
                  city: "Delhi, India",
                  aqi: 189,
                  pm25: 124,
                  cat: "Very Unhealthy",
                  color: "#dc2626",
                },
                {
                  city: "Lahore, Pakistan",
                  aqi: 168,
                  pm25: 108,
                  cat: "Unhealthy",
                  color: "#ef4444",
                },
                {
                  city: "Dhaka, Bangladesh",
                  aqi: 155,
                  pm25: 97,
                  cat: "Unhealthy",
                  color: "#ef4444",
                },
                {
                  city: "Beijing, China",
                  aqi: 102,
                  pm25: 58,
                  cat: "Moderate",
                  color: "#f59e0b",
                },
                {
                  city: "Jakarta, Indonesia",
                  aqi: 96,
                  pm25: 51,
                  cat: "Moderate",
                  color: "#f59e0b",
                },
                {
                  city: "Cairo, Egypt",
                  aqi: 88,
                  pm25: 44,
                  cat: "Moderate",
                  color: "#f59e0b",
                },
                {
                  city: "London, UK",
                  aqi: 42,
                  pm25: 12,
                  cat: "Good",
                  color: "#22c55e",
                },
                {
                  city: "New York, US",
                  aqi: 38,
                  pm25: 9,
                  cat: "Good",
                  color: "#22c55e",
                },
                {
                  city: "Sydney, Australia",
                  aqi: 22,
                  pm25: 5,
                  cat: "Good",
                  color: "#10b981",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.city}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: row.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-semibold font-sans truncate"
                      style={{ color: headText }}
                    >
                      {row.city}
                    </p>
                    <p
                      className="text-[9px] font-mono"
                      style={{ color: row.color }}
                    >
                      {row.cat}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-[13px] font-bold font-mono"
                      style={{ color: row.color }}
                    >
                      {row.aqi}
                    </p>
                    <p
                      className="text-[8px] font-mono"
                      style={{ color: mutedText }}
                    >
                      AQI · {row.pm25} μg/m³
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: IQAir World Air Quality Report 2024 · WHO PM2.5 guideline:
              5 μg/m³
            </p>
          </div>

          {/* Global Temperature Anomaly */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Global Temperature
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Anomaly vs. 1850–1900 Baseline
            </h3>
            <div className="flex flex-col gap-2 mb-4">
              {[
                { year: "1980", anomaly: +0.27, bar: 17 },
                { year: "1990", anomaly: +0.44, bar: 27 },
                { year: "2000", anomaly: +0.42, bar: 26 },
                { year: "2010", anomaly: +0.63, bar: 39 },
                { year: "2015", anomaly: +0.87, bar: 54 },
                { year: "2020", anomaly: +1.02, bar: 63 },
                { year: "2022", anomaly: +1.15, bar: 71 },
                { year: "2023", anomaly: +1.45, bar: 90 },
                { year: "2024", anomaly: +1.54, bar: 96 },
                { year: "2025", anomaly: +1.58, bar: 98 },
                { year: "2026 (est.)", anomaly: +1.61, bar: 100 },
              ].map((row) => (
                <div key={row.year} className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-mono w-20 shrink-0"
                    style={{ color: mutedText }}
                  >
                    {row.year}
                  </span>
                  <div
                    className="flex-1 h-3 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${row.bar}%`,
                        background:
                          row.anomaly > 1.0
                            ? "#ef4444"
                            : row.anomaly > 0.6
                              ? "#f97316"
                              : "#f59e0b",
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold font-mono w-12 text-right shrink-0"
                    style={{
                      color:
                        row.anomaly > 1.0
                          ? "#ef4444"
                          : row.anomaly > 0.6
                            ? "#f97316"
                            : "#f59e0b",
                    }}
                  >
                    +{row.anomaly}°C
                  </span>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl px-3 py-2.5 mt-2"
              style={{ background: "#ef444412", border: "1px solid #ef444425" }}
            >
              <p
                className="text-[10px] font-bold font-sans"
                style={{ color: "#ef4444" }}
              >
                2024–2025 confirmed hottest consecutive years in recorded
                history
              </p>
              <p
                className="text-[9px] font-sans mt-0.5"
                style={{ color: mutedText }}
              >
                Paris Agreement 1.5°C limit officially breached as annual mean
                in 2024
              </p>
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: Copernicus C3S / NASA GISS / NOAA GlobalTemp 2026
            </p>
          </div>

          {/* Sea Level Rise */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Sea Level Rise
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Global Mean Sea Level (GMSL)
            </h3>
            <div className="flex flex-col gap-2 mb-3">
              {[
                {
                  label: "Rise since 1993 (satellite era)",
                  value: "+115 mm",
                  color: "#3b82f6",
                  sub: "Measured by altimetry",
                },
                {
                  label: "Current rate (2026)",
                  value: "+4.8 mm/yr",
                  color: "#ef4444",
                  sub: "Accelerating from 3.1 mm/yr in 1990s",
                },
                {
                  label: "Projected rise by 2050 (RCP4.5)",
                  value: "+25–30 cm",
                  color: "#f97316",
                  sub: "Above 2000 baseline",
                },
                {
                  label: "Projected rise by 2100 (RCP8.5)",
                  value: "+0.6–1.1 m",
                  color: "#dc2626",
                  sub: "High-end scenario",
                },
                {
                  label: "Thermal expansion contribution",
                  value: "~43%",
                  color: "#6366f1",
                  sub: "Of total GMSL rise",
                },
                {
                  label: "Ice sheet melt contribution",
                  value: "~36%",
                  color: "#06b6d4",
                  sub: "Greenland + Antarctica",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg px-3 py-2"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className="text-[10px] font-sans font-semibold"
                      style={{ color: headText }}
                    >
                      {row.label}
                    </p>
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: row.color }}
                    >
                      {row.value}
                    </p>
                  </div>
                  <p
                    className="text-[9px] font-sans"
                    style={{ color: mutedText }}
                  >
                    {row.sub}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl px-3 py-2.5"
              style={{ background: "#3b82f612", border: "1px solid #3b82f625" }}
            >
              <p
                className="text-[10px] font-bold font-sans"
                style={{ color: "#3b82f6" }}
              >
                ~1 billion people live in low-elevation coastal zones
              </p>
              <p
                className="text-[9px] font-sans mt-0.5"
                style={{ color: mutedText }}
              >
                Bangladesh, Vietnam, Indonesia most exposed to inundation by
                2100
              </p>
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: NASA Sea Level Change / IPCC SROCC / Copernicus 2026
            </p>
          </div>
        </div>

        {/* Row 2 — Arctic Ice + Deforestation + Plastic Pollution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Arctic & Antarctic Ice */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Polar Ice Coverage
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Arctic &amp; Antarctic Ice Extent 2026
            </h3>
            <div className="flex flex-col gap-3 mb-3">
              {[
                {
                  label: "Arctic Sea Ice (Sept 2023 minimum)",
                  value: "4.23 M km²",
                  prev: "Lowest on record",
                  color: "#06b6d4",
                  pct: 28,
                },
                {
                  label: "Arctic Sea Ice (1980s avg. minimum)",
                  value: "7.05 M km²",
                  prev: "Historical baseline",
                  color: "#22c55e",
                  pct: 47,
                },
                {
                  label: "Antarctic Sea Ice (Feb 2023)",
                  value: "1.91 M km²",
                  prev: "Record low — 1M below avg.",
                  color: "#ef4444",
                  pct: 13,
                },
                {
                  label: "Greenland Ice Mass Loss (2023)",
                  value: "−280 Gt/yr",
                  prev: "Accelerating since 2000s",
                  color: "#f97316",
                  pct: 65,
                },
                {
                  label: "Arctic warming rate",
                  value: "×3–4 faster",
                  prev: "Than global mean",
                  color: "#dc2626",
                  pct: 90,
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className="text-[10px] font-sans font-semibold truncate pr-2"
                      style={{ color: headText }}
                    >
                      {row.label}
                    </p>
                    <p
                      className="text-[11px] font-bold font-mono shrink-0"
                      style={{ color: row.color }}
                    >
                      {row.value}
                    </p>
                  </div>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                  <p
                    className="text-[8px] font-mono mt-0.5"
                    style={{ color: mutedText }}
                  >
                    {row.prev}
                  </p>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-2"
              style={{ color: mutedText }}
            >
              Source: NSIDC / ESA CryoSat / NASA GRACE-FO 2026
            </p>
          </div>

          {/* Deforestation Tracker */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Deforestation
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Global Forest Loss Tracker 2025
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Tropical forest lost (2023)",
                  value: "3.7M ha",
                  color: "#ef4444",
                },
                {
                  label: "Brazil Amazon loss",
                  value: "1.1M ha",
                  color: "#f97316",
                },
                {
                  label: "DRC Congo Basin loss",
                  value: "0.49M ha",
                  color: "#f59e0b",
                },
                { label: "Bolivia loss", value: "0.39M ha", color: "#f97316" },
                {
                  label: "Trees lost per minute",
                  value: "~25 ha",
                  color: "#dc2626",
                },
                {
                  label: "Global tree cover (change)",
                  value: "−2.3%",
                  color: "#ef4444",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  region: "Southeast Asia",
                  driver: "Palm oil & pulpwood",
                  loss: 88,
                },
                {
                  region: "South America",
                  driver: "Cattle ranching & soy",
                  loss: 95,
                },
                {
                  region: "Central Africa",
                  driver: "Subsistence & logging",
                  loss: 72,
                },
                {
                  region: "South Asia",
                  driver: "Agriculture expansion",
                  loss: 61,
                },
              ].map((row, i, arr) => (
                <div
                  key={row.region}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold font-sans"
                      style={{ color: headText }}
                    >
                      {row.region}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {row.driver}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.loss}%`, background: "#ef4444" }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-6 text-right"
                      style={{ color: "#ef4444" }}
                    >
                      {row.loss}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: Global Forest Watch / Hansen et al. 2025 / PRODES/INPE
            </p>
          </div>

          {/* Plastic Pollution */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Plastic Pollution
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Global Plastic Waste 2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Plastic produced annually",
                  value: "430 MT",
                  color: "#dc2626",
                },
                {
                  label: "Ocean plastic stock",
                  value: "~170 MT",
                  color: "#3b82f6",
                },
                {
                  label: "New ocean input per year",
                  value: "11 MT",
                  color: "#f97316",
                },
                {
                  label: "Recycling rate (global)",
                  value: "9%",
                  color: "#f59e0b",
                },
                {
                  label: "Single-use plastic share",
                  value: "36%",
                  color: "#ef4444",
                },
                {
                  label: "Microplastic in ocean",
                  value: "24.4 T",
                  color: "#6366f1",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  country: "Philippines",
                  share: 36,
                  note: "Top ocean polluter by mass",
                },
                {
                  country: "India",
                  share: 13,
                  note: "Ganges river plastic source",
                },
                {
                  country: "Malaysia",
                  share: 9,
                  note: "Import & domestic waste",
                },
                {
                  country: "China",
                  share: 8,
                  note: "Reduced from 28% in 2010",
                },
                {
                  country: "Indonesia",
                  share: 7,
                  note: "Java & Sumatra coastlines",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.country}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold font-sans"
                      style={{ color: headText }}
                    >
                      {row.country}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {row.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.share * 2.5}%`,
                          background: "#3b82f6",
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-6 text-right"
                      style={{ color: "#3b82f6" }}
                    >
                      {row.share}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: Our World in Data / UNEP 2025 / Science (Borrelle et al.)
            </p>
          </div>
        </div>

        {/* Row 3 — Renewable Energy + Extreme Weather + Water Stress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Renewable Energy Progress */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Clean Energy
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Renewable Energy Share by Country 2026
            </h3>
            <div className="flex flex-col gap-2 mb-3">
              {[
                {
                  country: "Iceland",
                  pct: 99,
                  source: "Geothermal + Hydro",
                  color: "#10b981",
                },
                {
                  country: "Norway",
                  pct: 98,
                  source: "Hydropower",
                  color: "#10b981",
                },
                {
                  country: "Denmark",
                  pct: 88,
                  source: "Wind dominant",
                  color: "#22c55e",
                },
                {
                  country: "Germany",
                  pct: 62,
                  source: "Wind + Solar",
                  color: "#84cc16",
                },
                {
                  country: "China",
                  pct: 38,
                  source: "Fastest growing",
                  color: "#f59e0b",
                },
                {
                  country: "USA",
                  pct: 28,
                  source: "Wind + Solar surge",
                  color: "#f59e0b",
                },
                {
                  country: "India",
                  pct: 27,
                  source: "Solar expansion",
                  color: "#f97316",
                },
                {
                  country: "Saudi Arabia",
                  pct: 6,
                  source: "Vision 2030 solar",
                  color: "#ef4444",
                },
                {
                  country: "World avg.",
                  pct: 34,
                  source: "IEA 2026",
                  color: "#3b82f6",
                },
              ].map((row) => (
                <div key={row.country} className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-sans w-24 shrink-0 font-semibold truncate"
                    style={{ color: headText }}
                  >
                    {row.country}
                  </span>
                  <div
                    className="flex-1 h-2.5 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold font-mono w-8 text-right shrink-0"
                    style={{ color: row.color }}
                  >
                    {row.pct}%
                  </span>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl px-3 py-2.5 mt-1"
              style={{ background: "#22c55e12", border: "1px solid #22c55e25" }}
            >
              <p
                className="text-[10px] font-bold font-sans"
                style={{ color: "#22c55e" }}
              >
                Solar capacity has grown ×350 since 2010
              </p>
              <p
                className="text-[9px] font-sans mt-0.5"
                style={{ color: mutedText }}
              >
                Cost of solar PV fell 92% over the same period · IEA 2026
              </p>
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: IEA World Energy Outlook 2026 / IRENA 2026
            </p>
          </div>

          {/* Extreme Weather Events */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Extreme Weather
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Climate Disaster Statistics 2025–2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Billion-dollar disasters (2025)",
                  value: "34",
                  color: "#ef4444",
                },
                {
                  label: "Economic losses (2025)",
                  value: "$320B",
                  color: "#dc2626",
                },
                {
                  label: "Flood events (2025)",
                  value: "198",
                  color: "#3b82f6",
                },
                {
                  label: "Wildfires (2025, global)",
                  value: "341K",
                  color: "#f97316",
                },
                {
                  label: "Extreme heat days (US 2026)",
                  value: "+18%",
                  color: "#f59e0b",
                },
                {
                  label: "Cat. 4–5 hurricanes (2025)",
                  value: "11",
                  color: "#dc2626",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  event: "Canada Wildfires 2023",
                  impact: "18.5M ha burned — largest ever",
                  color: "#f97316",
                },
                {
                  event: "Valencia Floods (Oct 2024)",
                  impact: "230+ dead — deadliest EU flood in decades",
                  color: "#3b82f6",
                },
                {
                  event: "LA Wildfires Jan 2025",
                  impact: "Palisades & Eaton fires — $135B damage",
                  color: "#ef4444",
                },
                {
                  event: "India Heat Wave 2026",
                  impact: "53.4°C in Rajasthan — new record",
                  color: "#f59e0b",
                },
                {
                  event: "Brazil Floods 2024",
                  impact: "Rio Grande do Sul — 150+ dead, 400K displaced",
                  color: "#06b6d4",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.event}
                  className="flex items-start gap-2.5 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                    style={{ background: row.color }}
                  />
                  <div>
                    <p
                      className="text-[10px] font-bold font-sans"
                      style={{ color: headText }}
                    >
                      {row.event}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                      dangerouslySetInnerHTML={{ __html: row.impact }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: NOAA NCEI / Munich Re NatCatSERVICE / EM-DAT 2026
            </p>
          </div>

          {/* Water Stress & Access */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Water Stress &amp; Access
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Global Freshwater Security 2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "People under high water stress",
                  value: "3.6B",
                  color: "#ef4444",
                },
                {
                  label: "Without safe drinking water",
                  value: "2.2B",
                  color: "#dc2626",
                },
                {
                  label: "Without basic sanitation",
                  value: "3.5B",
                  color: "#f97316",
                },
                {
                  label: "Aquifers under depletion threat",
                  value: "~37",
                  color: "#f59e0b",
                },
                {
                  label: "Annual freshwater withdrawal",
                  value: "4,000 km³",
                  color: "#3b82f6",
                },
                {
                  label: "Ag share of water use",
                  value: "70%",
                  color: "#22c55e",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  country: "Qatar",
                  stress: 98,
                  note: "Extremely high baseline stress",
                },
                {
                  country: "Israel",
                  stress: 95,
                  note: "Desalination-dependent",
                },
                {
                  country: "Lebanon",
                  stress: 90,
                  note: "Infrastructure collapse",
                },
                { country: "India", stress: 83, note: "Groundwater crisis" },
                {
                  country: "South Africa",
                  stress: 72,
                  note: "Cape Town day-zero event",
                },
                { country: "USA", stress: 41, note: "West/Southwest critical" },
              ].map((row, i, arr) => (
                <div
                  key={row.country}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold font-sans"
                      style={{ color: headText }}
                    >
                      {row.country}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {row.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.stress}%`,
                          background:
                            row.stress > 80
                              ? "#ef4444"
                              : row.stress > 55
                                ? "#f97316"
                                : "#f59e0b",
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-6 text-right"
                      style={{
                        color:
                          row.stress > 80
                            ? "#ef4444"
                            : row.stress > 55
                              ? "#f97316"
                              : "#f59e0b",
                      }}
                    >
                      {row.stress}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: WRI Aqueduct 4.0 / WHO/UNICEF JMP 2026 / FAO AQUASTAT
            </p>
          </div>
        </div>

        {/* Row 4 — CO2 Emissions + Biodiversity + Soil Degradation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* CO2 Emissions by Country */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              CO₂ Emissions
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Top Emitters &amp; Per-Capita 2025
            </h3>
            <div className="flex flex-col gap-2 mb-3">
              {[
                {
                  country: "China",
                  total: 12.4,
                  perCap: 8.7,
                  pct: 31,
                  color: "#ef4444",
                },
                {
                  country: "USA",
                  total: 4.8,
                  perCap: 14.2,
                  pct: 12,
                  color: "#f97316",
                },
                {
                  country: "India",
                  total: 3.2,
                  perCap: 2.2,
                  pct: 8,
                  color: "#f59e0b",
                },
                {
                  country: "Russia",
                  total: 1.8,
                  perCap: 12.4,
                  pct: 4,
                  color: "#f97316",
                },
                {
                  country: "Japan",
                  total: 1.0,
                  perCap: 8.3,
                  pct: 3,
                  color: "#f59e0b",
                },
                {
                  country: "Germany",
                  total: 0.6,
                  perCap: 7.2,
                  pct: 2,
                  color: "#84cc16",
                },
                {
                  country: "Saudi Arabia",
                  total: 0.8,
                  perCap: 20.1,
                  pct: 2,
                  color: "#f59e0b",
                },
                {
                  country: "EU-27",
                  total: 2.4,
                  perCap: 5.4,
                  pct: 6,
                  color: "#22c55e",
                },
              ].map((row) => (
                <div key={row.country} className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-sans w-24 shrink-0 font-semibold truncate"
                    style={{ color: headText }}
                  >
                    {row.country}
                  </span>
                  <div
                    className="flex-1 h-2.5 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${row.pct * 3}%`,
                        background: row.color,
                      }}
                    />
                  </div>
                  <span
                    className="text-[9px] font-mono w-14 text-right shrink-0"
                    style={{ color: row.color }}
                  >
                    {row.total} Gt
                  </span>
                </div>
              ))}
            </div>
            <div
              className="flex flex-col gap-1 rounded-xl px-3 py-2.5"
              style={{
                background: isLight
                  ? "rgba(0,0,0,0.025)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${gridLine}`,
              }}
            >
              <p
                className="text-[10px] font-bold font-sans"
                style={{ color: headText }}
              >
                Global total 2025: 37.8 Gt CO₂ — new record
              </p>
              <p className="text-[9px] font-sans" style={{ color: mutedText }}>
                Carbon Budget: ~180 Gt remaining for 1.5°C (7 yrs at current
                pace)
              </p>
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: Global Carbon Project 2025 / IEA 2026
            </p>
          </div>

          {/* Biodiversity Loss */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Biodiversity
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Species Loss &amp; Ecosystem Health 2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Species at risk of extinction",
                  value: "44,000+",
                  color: "#dc2626",
                },
                {
                  label: "Vertebrate pop. decline 1970–2020",
                  value: "−69%",
                  color: "#ef4444",
                },
                {
                  label: "Insect pop. decline (global)",
                  value: "−45%",
                  color: "#f97316",
                },
                {
                  label: "Coral reef loss since 1950s",
                  value: "−50%",
                  color: "#f59e0b",
                },
                {
                  label: "Wetlands lost since 1700",
                  value: "−35%",
                  color: "#3b82f6",
                },
                {
                  label: "Mangrove loss since 1980",
                  value: "−25%",
                  color: "#10b981",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                { group: "Amphibians", threatened: 41, color: "#ef4444" },
                { group: "Sharks & Rays", threatened: 37, color: "#f97316" },
                { group: "Freshwater fish", threatened: 33, color: "#3b82f6" },
                { group: "Mammals", threatened: 26, color: "#f59e0b" },
                { group: "Birds", threatened: 14, color: "#84cc16" },
              ].map((row, i, arr) => (
                <div
                  key={row.group}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className="text-[10px] font-semibold font-sans"
                        style={{ color: headText }}
                      >
                        {row.group}
                      </p>
                      <p
                        className="text-[10px] font-bold font-mono"
                        style={{ color: row.color }}
                      >
                        {row.threatened}% threatened
                      </p>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.threatened * 2.4}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: IUCN Red List 2026 / WWF Living Planet Report 2024
            </p>
          </div>

          {/* Soil Degradation & Food Security */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Soil &amp; Food Security
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Land Degradation &amp; Hunger 2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Degraded land globally",
                  value: "3.2B ha",
                  color: "#a16207",
                },
                {
                  label: "Topsoil lost per year",
                  value: "24 Gt",
                  color: "#b45309",
                },
                {
                  label: "People facing food insecurity",
                  value: "733M",
                  color: "#ef4444",
                },
                {
                  label: "Undernourished globally",
                  value: "9.2%",
                  color: "#f97316",
                },
                {
                  label: "Loss from land degradation/yr",
                  value: "$6.3T",
                  color: "#dc2626",
                },
                {
                  label: "Soil carbon loss (est. historic)",
                  value: "~133 Gt",
                  color: "#78716c",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  region: "Sub-Saharan Africa",
                  hunger: 22,
                  note: "Rising conflict + drought",
                },
                {
                  region: "South Asia",
                  hunger: 16,
                  note: "Climate-driven crop failures",
                },
                {
                  region: "SE Asia",
                  hunger: 9,
                  note: "Improving but vulnerable",
                },
                {
                  region: "Latin America",
                  hunger: 8,
                  note: "Inequality-driven",
                },
                {
                  region: "Near East/N. Africa",
                  hunger: 12,
                  note: "Water scarcity primary driver",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.region}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold font-sans"
                      style={{ color: headText }}
                    >
                      {row.region}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {row.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.hunger * 4}%`,
                          background:
                            row.hunger > 15
                              ? "#ef4444"
                              : row.hunger > 10
                                ? "#f97316"
                                : "#f59e0b",
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-8 text-right"
                      style={{
                        color:
                          row.hunger > 15
                            ? "#ef4444"
                            : row.hunger > 10
                              ? "#f97316"
                              : "#f59e0b",
                      }}
                    >
                      {row.hunger}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: FAO SOFO 2026 / UNCCD / WFP Global Report on Food Crises
              2026
            </p>
          </div>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div className="text-center py-3 border-t border-border mt-2">
          <p className="text-[11px] font-sans text-muted-foreground">
            © {new Date().getFullYear()} CommonSphere · Planetary Boundaries ·
            Sources: Rockström et al., IPCC, IPBES, Stockholm Resilience Centre
          </p>
        </div>
      </div>
    </div>
  );
}
