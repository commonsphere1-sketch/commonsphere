/**
 * Cause and effect for what the Climate page measures now: what raises each
 * reading, and what it does - each sentence in the words of the agency it is
 * from, with the figure that agency gives. Read on 7 October 2026.
 *
 * The sources are four pages of three US agencies, all in the public domain:
 * the EPA's overview of greenhouse gases (where each gas comes from), NASA's
 * pages on the causes and the effects of climate change, and NOAA's Annual
 * Greenhouse Gas Index (how much of the heating each gas accounts for).
 * Nothing is added to them: a gas's lifetime or warming potential is not
 * given, because none of these pages gives it.
 */
import type { Source } from "./climateContext";

export const CAUSES_CHECKED = "7 October 2026";

const EPA: Source = { label: "US EPA: overview of greenhouse gases", url: "https://www.epa.gov/ghgemissions/overview-greenhouse-gases" };
const NASA_CAUSES: Source = { label: "NASA: the causes of climate change", url: "https://science.nasa.gov/climate-change/causes/" };
const NASA_EFFECTS: Source = { label: "NASA: the effects of climate change", url: "https://science.nasa.gov/climate-change/effects/" };
const AGGI: Source = { label: "NOAA Annual Greenhouse Gas Index, updated autumn 2025", url: "https://gml.noaa.gov/aggi/aggi.html" };

export type CauseEffect = { cause: string; effect: string; sources: Source[] };

const CO2: CauseEffect = {
  cause:
    "Carbon dioxide enters the air through the burning of fossil fuels - coal, natural gas and oil - of solid waste, and of trees and other biological materials, and through certain chemical reactions such as making cement. Industrial activity has raised its level by nearly 50% since 1750, and the rise carries the isotopic fingerprint of human activity.",
  effect: "It is the largest part of the heating from long-lived greenhouse gases: 2.33 watts per square metre in 2024, 66% of the total.",
  sources: [EPA, NASA_CAUSES, AGGI],
};

/** By the id of the reading in climateIndicators.ts. */
export const CLIMATE_CAUSES: Record<string, CauseEffect> = {
  co2: CO2,
  "co2-global": CO2,
  ch4: {
    cause:
      "Methane is emitted in the production and transport of coal, natural gas and oil, by livestock and other agricultural practices, by land use, and by the decay of organic waste in landfills. It also has natural sources, among them the breakdown of plant matter in wetlands.",
    effect: "It accounts for 0.57 watts per square metre of the heating from long-lived greenhouse gases in 2024, 16% of the total.",
    sources: [EPA, NASA_CAUSES, AGGI],
  },
  n2o: {
    cause:
      "Nitrous oxide is emitted in agricultural, land-use and industrial activities, in the combustion of fossil fuels and solid waste, and in the treatment of wastewater. NASA calls it a potent greenhouse gas produced by farming practices, released in the making and use of commercial and organic fertilizer.",
    effect:
      "With carbon dioxide, methane, CFC-12 and CFC-11 it is one of the five gases that accounted for about 96% of the heating from long-lived greenhouse gases in 2024.",
    sources: [EPA, NASA_CAUSES, AGGI],
  },
  warming: {
    cause:
      "Scientists attribute the warming since the mid-twentieth century to the human expansion of the greenhouse effect. Increases in long-lived greenhouse gases - carbon dioxide, methane, nitrous oxide and halogenated compounds - are the main cause of the rise in global temperature over the industrial period. The Sun's energy has stayed constant or fallen slightly since 1750, so it is extremely unlikely to be the cause.",
    effect:
      "Effects long predicted are now occurring: the loss of sea ice, faster sea-level rise, and longer, more intense heat waves. The intensity and rainfall of hurricanes are projected to increase as the climate goes on warming, and sea level to rise at least another 0.3 m by 2100.",
    sources: [NASA_CAUSES, AGGI, NASA_EFFECTS],
  },
  aggi: {
    cause:
      "The index adds up the heating - the radiative forcing - of the long-lived greenhouse gases as their amounts in the air grow. Carbon dioxide was 66% of it in 2024 and methane 16%; nitrous oxide and the halogenated gases make up the rest.",
    effect: "The heating from these gases was 54% greater in 2024 than in 1990. Together they then equalled 539 ppm of carbon dioxide.",
    sources: [AGGI],
  },
  "sea-ice": {
    cause: "NASA names the loss of sea ice among the effects of global climate change that scientists had long predicted and that are now occurring.",
    effect: "Sea-ice cover in the Arctic Ocean is expected to go on decreasing, and the Arctic Ocean will very likely become essentially ice-free in late summer if current projections hold.",
    sources: [NASA_EFFECTS],
  },
};
