/**
 * The nine planetary boundaries as the Planetary Health Check 2026 assesses
 * them - the third annual check by PBScience at the Potsdam Institute for
 * Climate Impact Research, building on Rockström et al. 2009, Steffen et
 * al. 2015 and Richardson et al. 2023.
 *
 * Every figure here is the report's own: the current value of each control
 * variable, the planetary boundary, the high-risk line, and the pre-human
 * baseline the report draws its charts from. Page numbers are those printed
 * in the summary document (DOI 10.48485/pik.2026.26). Where the report
 * gives no number - the current value for novel entities, the high-risk line
 * for novel entities - there is none here either.
 *
 * The wheel on the page places each control variable by arithmetic on those
 * figures, not by judgement: from the baseline to the boundary it runs 0 to
 * 1, and from the boundary to the high-risk line 1 to 2 (see `position`).
 */

export const PHC_2026 = {
  title: "Planetary Health Check 2026",
  publisher: "PBScience, Potsdam Institute for Climate Impact Research",
  summaryUrl: "https://doi.org/10.48485/pik.2026.26",
  reportUrl: "https://doi.org/10.48485/pik.2026.25",
  siteUrl: "https://www.planetaryhealthcheck.org/",
} as const;

/** The report's three zones: within the safe operating space, the zone of increasing risk, the high-risk zone. */
export type Zone = "safe" | "increasing" | "high";

export type ControlVariable = {
  name: string;
  unit: string;
  /** As the report states it: "426", "100–1,000", or a words-only verdict. */
  current: string;
  /** The number used to place it; for a range, the end nearer the boundary. Null when not quantified. */
  value: number | null;
  boundary: number;
  /** Null when the report defines none. */
  highRisk: number | null;
  /** The report marks some high-risk lines provisional. */
  highRiskProvisional?: boolean;
  /** The pre-human reference the report's charts start from; null when it gives none. */
  baseline: number | null;
  /** A regional measure alongside the global one; it does not set the boundary's standing. */
  regional?: boolean;
  zone: Zone;
};

export type PlanetaryBoundary = {
  id: string;
  name: string;
  shortName: string;
  /** The report's verdict, in its words. */
  verdict: string;
  /** The standing of its most transgressed global control variable, as the report places it. */
  zone: Zone;
  summary: string;
  variables: ControlVariable[];
  drivers: string[];
  impacts: string[];
  /** Page of the summary document. */
  page: number;
};

/**
 * Where a value sits: 0 at the baseline, 1 at the boundary, 2 at the
 * high-risk line, straight lines between. The same sum works whichever way
 * is worse (ozone and forest cover fall, carbon dioxide rises).
 */
export function position(v: ControlVariable): number | null {
  if (v.value === null) return null;
  // Which way is worse: toward the high-risk line, or else away from the baseline.
  const worse =
    v.highRisk !== null ? Math.sign(v.highRisk - v.boundary) : v.baseline !== null ? Math.sign(v.boundary - v.baseline) : 0;
  if (!worse) return null;
  if ((v.value - v.boundary) * worse > 0) return v.highRisk === null ? null : 1 + (v.value - v.boundary) / (v.highRisk - v.boundary);
  return v.baseline === null ? null : (v.value - v.baseline) / (v.boundary - v.baseline);
}

export const BOUNDARIES: PlanetaryBoundary[] = [
  {
    id: "climate",
    name: "Climate Change",
    shortName: "Climate",
    verdict: "Strongly transgressed",
    zone: "high",
    summary:
      "Both measures are past the boundary and still worsening: atmospheric carbon dioxide has reached 426 ppm, against a boundary of 350, and human-caused radiative forcing is +3.10 W/m², more than three times the boundary of +1.0.",
    variables: [
      { name: "Atmospheric carbon dioxide", unit: "ppm", current: "426", value: 426, boundary: 350, highRisk: 450, baseline: 280, zone: "increasing" },
      { name: "Human-caused radiative forcing", unit: "W/m²", current: "+3.10", value: 3.1, boundary: 1, highRisk: 1.5, baseline: 0, zone: "high" },
    ],
    drivers: [
      "Carbon dioxide from burning coal, oil and gas, from cement and from deforestation",
      "Methane from farming, fossil-fuel extraction and landfills; nitrous oxide from fertiliser",
      "Land-use change, aerosols and cities changing how much sunlight Earth reflects",
    ],
    impacts: [
      "Rising temperatures and more frequent, more intense heatwaves, downpours, droughts and floods",
      "Melting land ice and rising seas; warming and acidifying oceans",
      "Growing risks to health, food, water and infrastructure, and of self-reinforcing change if tipping points are crossed",
    ],
    page: 27,
  },
  {
    id: "novel_entities",
    name: "Introduction of Novel Entities",
    shortName: "Novel Entities",
    verdict: "Strongly transgressed",
    zone: "high",
    summary:
      "The boundary is that nothing new should enter the environment without adequate safety testing. Plastics, synthetic chemicals, pesticides and PFASs keep being produced and released faster than they are tested, monitored or regulated; the report places this boundary in the high-risk zone, though it is not measured as a single number.",
    variables: [
      {
        name: "Share of novel entities released without adequate safety testing",
        unit: "%",
        current: "Transgressed (not quantified)",
        value: null,
        boundary: 0,
        highRisk: null,
        baseline: 0,
        zone: "high",
      },
    ],
    drivers: [
      "Fast growth in the amount and variety of chemicals and materials produced",
      "Release through industry, farming, consumer goods, healthcare and waste",
      "Testing, monitoring and regulation lagging, above all for mixtures and long-term effects",
    ],
    impacts: [
      "PFASs detected in water, soil, wildlife and people around the world",
      "PCBs still harming marine mammals decades after they were banned; plastics and microplastics everywhere",
      "Pesticides contributing to the decline of insects and pollinators; antimicrobial use driving resistance",
    ],
    page: 35,
  },
  {
    id: "ozone",
    name: "Stratospheric Ozone Depletion",
    shortName: "Ozone Depletion",
    verdict: "Within the safe operating space",
    zone: "safe",
    summary:
      "Stratospheric ozone outside the polar regions averages about 286 DU, above the boundary of 277 DU. It has recovered since the mid-1990s as ozone-depleting substances were phased out under the Montreal Protocol, though recovery may have levelled off and ozone is still below mid-20th-century levels.",
    variables: [
      { name: "Stratospheric ozone outside the polar regions", unit: "DU", current: "285.7", value: 285.7, boundary: 277, highRisk: 263, baseline: 292, zone: "safe" },
    ],
    drivers: [
      "Historically chlorofluorocarbons (CFCs), phased out under the Montreal Protocol",
      "Still of concern: nitrous oxide from farming, and rocket launches and re-entering space debris",
    ],
    impacts: [
      "Antarctic ozone loss has shifted Southern Hemisphere winds and rainfall",
      "More ultraviolet light at the surface harms plants, crops and aquatic life",
    ],
    page: 34,
  },
  {
    id: "aerosol",
    name: "Increase in Atmospheric Aerosol Loading",
    shortName: "Aerosol Loading",
    verdict: "Within the safe operating space globally; transgressed over South Asia",
    zone: "safe",
    summary:
      "Globally the difference in aerosol optical depth between the Northern and Southern Hemispheres is about 0.07, below the boundary of 0.10, and has fallen since around 2010. Over South Asia aerosol loading is 0.32, above the proposed regional boundary of 0.25, with a risk of weakening or delaying the monsoon.",
    variables: [
      { name: "Difference in aerosol optical depth between the hemispheres", unit: "", current: "0.07", value: 0.07, boundary: 0.1, highRisk: 0.25, baseline: 0.04, zone: "safe" },
      { name: "Aerosol optical depth over South Asia", unit: "", current: "0.32", value: 0.32, boundary: 0.25, highRisk: 0.5, baseline: null, regional: true, zone: "increasing" },
    ],
    drivers: [
      "Fossil-fuel combustion, industry and transport",
      "Burning biomass: farm fires and forest fires",
      "Emissions falling in many richer regions but high or rising in Asia and Africa",
    ],
    impacts: [
      "Shifted circulation and rainfall, and a risk of a weaker or later South Asian monsoon",
      "Fine particles damaging lungs and hearts",
      "Lower crop yields where rainfall depends on the season",
    ],
    page: 33,
  },
  {
    id: "ocean",
    name: "Ocean Acidification",
    shortName: "Ocean Acidification",
    verdict: "Transgressed",
    zone: "increasing",
    summary:
      "The global mean surface aragonite saturation state is 2.85, just past the boundary of 2.86 (80% of the pre-industrial 3.57). The Arctic and Southern Oceans are changing fastest.",
    variables: [
      {
        name: "Surface aragonite saturation state, global mean",
        unit: "Ω",
        current: "2.85",
        value: 2.85,
        boundary: 2.86,
        highRisk: 2.5,
        highRiskProvisional: true,
        baseline: 3.57,
        zone: "increasing",
      },
    ],
    drivers: ["Carbon dioxide from human emissions dissolving into the sea as carbonic acid", "Locally, nutrient runoff, upwelling and freshwater inflow"],
    impacts: [
      "Shell damage and dissolution in pteropods, small sea snails at the base of marine food webs",
      "Tropical reefs recovering less well, alongside bleaching from warming",
      "Deep-water corals increasingly bathed in corrosive water; a weaker ocean carbon sink",
    ],
    page: 32,
  },
  {
    id: "biogeochemical",
    name: "Modification of Biogeochemical Flows",
    shortName: "Biogeochem. Flows",
    verdict: "Strongly transgressed",
    zone: "high",
    summary:
      "Both nutrient cycles are in the high-risk zone. About 18.2 Tg of mined phosphorus a year is spread on cropland, nearly three times the boundary of 6.2, and about 165 Tg of nitrogen a year is fixed for farming, against a boundary of 62.",
    variables: [
      { name: "Phosphorus: mined phosphorus applied to cropland", unit: "Tg/yr", current: "18.2", value: 18.2, boundary: 6.2, highRisk: 11.2, baseline: 0, zone: "high" },
      { name: "Nitrogen: fixed intentionally for agriculture", unit: "Tg/yr", current: "165", value: 165, boundary: 62, highRisk: 82, baseline: 0, zone: "high" },
    ],
    drivers: [
      "Fertiliser and manure spread on fields and pastures",
      "Runoff, erosion, sewage and manure carrying nutrients into streams and seas",
      "Over-fertilising, food waste, little recycling and poor sewage treatment",
    ],
    impacts: [
      "Algal blooms and dead zones short of oxygen in lakes, rivers and coastal seas",
      "Unsafe drinking water, lost fisheries and tourism, and nitrogen-related air pollution",
      "Phosphorus in soils and nitrogen in groundwater can go on doing harm for decades",
    ],
    page: 31,
  },
  {
    id: "freshwater",
    name: "Freshwater Change",
    shortName: "Freshwater",
    verdict: "Transgressed",
    zone: "increasing",
    summary:
      "Both measures are past the boundary, which both crossed around the 1940s. Unusually wet or dry river flow affects 22.6% of ice-free land (boundary 12.9%), and unusual soil moisture 22.0% (boundary 12.4%).",
    variables: [
      {
        name: "Blue water: land with unusual streamflow",
        unit: "% of ice-free land",
        current: "22.6",
        value: 22.6,
        boundary: 12.9,
        highRisk: 50,
        highRiskProvisional: true,
        baseline: 10.3,
        zone: "increasing",
      },
      {
        name: "Green water: land with unusual soil moisture",
        unit: "% of ice-free land",
        current: "22.0",
        value: 22,
        boundary: 12.4,
        highRisk: 50,
        highRiskProvisional: true,
        baseline: 9.8,
        zone: "increasing",
      },
    ],
    drivers: [
      "Climate change intensifying and moving rainfall, evaporation, droughts and floods",
      "Irrigation, withdrawals, dams and river regulation",
      "Deforestation, farming and urban growth changing how water moves through the land",
    ],
    impacts: [
      "More frequent droughts and floods and disrupted river flows",
      "Groundwater depletion and drying soils",
      "Pressure on drinking water, irrigation, hydropower and food production",
    ],
    page: 30,
  },
  {
    id: "land",
    name: "Land System Change",
    shortName: "Land System",
    verdict: "Transgressed",
    zone: "increasing",
    summary:
      "64% of the world's potential forest cover remains, below the boundary of 78%. Most major forest biomes are past their own thresholds, and their forest cover is still falling.",
    variables: [
      { name: "Forest cover remaining", unit: "% of potential", current: "64", value: 64, boundary: 78, highRisk: 54, baseline: 100, zone: "increasing" },
    ],
    drivers: ["Agricultural expansion, logging and infrastructure", "Increasingly, heat, drought, fire and pest outbreaks driven by climate change"],
    impacts: [
      "Biodiversity loss and carbon released by deforestation",
      "Disrupted rainfall and water flows, and soil degradation",
      "Wildfire damage and pest outbreaks, and a risk of large-scale shifts such as in the Amazon",
    ],
    page: 29,
  },
  {
    id: "biosphere",
    name: "Change in Biosphere Integrity",
    shortName: "Biosphere Integrity",
    verdict: "Strongly transgressed",
    zone: "high",
    summary:
      "Both measures are in the high-risk zone. Species are going extinct at more than 100 per million species-years, against a boundary of 10, and people take 21–30% of the land's potential plant productivity, against a boundary of 10%.",
    variables: [
      { name: "Genetic diversity: extinction rate", unit: "E/MSY", current: "100–1,000", value: 100, boundary: 10, highRisk: 100, baseline: 2, zone: "high" },
      {
        name: "Functional integrity: human appropriation of net primary production",
        unit: "% of potential",
        current: "21–30",
        value: 21,
        boundary: 10,
        highRisk: 20,
        baseline: null,
        zone: "high",
      },
    ],
    drivers: [
      "Habitats converted, degraded and fragmented by farming, grazing, forestry, infrastructure and cities",
      "Direct depletion by logging, fishing and other extraction",
      "Climate change, pollution, invasive species and nutrient overload adding to the pressure",
    ],
    impacts: [
      "Lost habitat, shrinking populations and whole evolutionary lineages gone",
      "Less pollination and natural pest control",
      "Weaker carbon uptake and storage, and less capacity for the Earth system to regulate itself",
    ],
    page: 28,
  },
];

/** How many boundaries the report finds transgressed: every one outside the safe operating space. */
export const TRANSGRESSED = BOUNDARIES.filter((b) => b.zone !== "safe").length;
