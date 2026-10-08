/**
 * The Climate page's "most publicly inquired" environmental figures: twelve
 * cards, each figure taken from the source it links to and dated to the
 * period the source gives. Checked 29 September 2026.
 *
 * These cards were hand-written, and much of what they said had no source
 * or contradicted one: the 2023 Arctic minimum as "lowest on record" (2012
 * holds it), "53.4°C in Rajasthan, a new record" in 2026 (India's record is
 * 51°C, in 2016), "~180 Gt, 7 years" of carbon budget (170 Gt, four years),
 * "3.2B ha degraded" (up to 40% of land; 3.2 billion was people), a city
 * air-quality table and per-country water-stress scores nobody published,
 * and a "2026 (est.)" temperature. What could not be sourced is gone.
 */

import type { Source } from "./climateContext";

export type Figure = { value: string; label: string };
export type BarRow = { label: string; value: number; display: string; color: string };
export type EventRow = { title: string; detail: string };

export type FigureCard = {
  id: string;
  kicker: string;
  title: string;
  figures?: Figure[];
  bars?: { caption: string; max: number; rows: BarRow[] };
  events?: EventRow[];
  callout?: { title: string; body: string; color: string };
  sources: Source[];
};

const RED = "#ef4444";
const DEEP_RED = "#dc2626";
const ORANGE = "#f97316";
const AMBER = "#f59e0b";
const BLUE = "#3b82f6";
const CYAN = "#06b6d4";
const GREEN = "#22c55e";
const EMERALD = "#10b981";
const SLATE = "#64748b";

/** NASA GISTEMP v4, annual (Jan–Dec) global means, °C against 1951–1980. */
const GISTEMP: [string, number][] = [
  ["1980", 0.26],
  ["1990", 0.45],
  ["2000", 0.39],
  ["2010", 0.72],
  ["2015", 0.9],
  ["2020", 1.01],
  ["2022", 0.89],
  ["2023", 1.17],
  ["2024", 1.29],
  ["2025", 1.19],
];

const ALL_FIGURE_CARDS: FigureCard[] = [
  {
    id: "air",
    kicker: "Air Quality",
    title: "Fine-particle pollution, 2025",
    figures: [
      { value: "99.6 µg/m³", label: "New Delhi's annual PM2.5, the most polluted capital" },
      { value: "112.5 µg/m³", label: "Loni, India, the most polluted city" },
      { value: "13", label: "countries within the WHO guideline" },
      { value: "14%", label: "of cities within it" },
      { value: "5 µg/m³", label: "WHO annual PM2.5 guideline" },
    ],
    sources: [
      {
        label: "IQAir World Air Quality Report 2025",
        url: "https://www.prnewswire.com/news-releases/iqairs-2025-world-air-quality-report-finds-only-14-of-cities-meet-who-air-pollution-guideline-302720338.html",
      },
      { label: "WHO global air quality guidelines (2021)", url: "https://www.who.int/publications/i/item/9789240034228" },
    ],
  },
  {
    id: "temperature",
    kicker: "Global Temperature",
    title: "Annual anomaly against 1951–1980",
    bars: {
      caption: "NASA GISTEMP v4, January–December mean",
      max: 1.4,
      rows: GISTEMP.map(([y, v]) => ({ label: y, value: v, display: `+${v.toFixed(2)}°C`, color: ORANGE })),
    },
    callout: {
      title: "2024 and 2025 are the two warmest years in NASA's record",
      body: "The WMO found 2024 was likely the first calendar year more than 1.5°C above 1850–1900 (1.55 ± 0.13°C). The Paris Agreement's limits refer to warming over decades, not a single year.",
      color: RED,
    },
    sources: [
      { label: "NASA GISS Surface Temperature Analysis (GISTEMP v4)", url: "https://data.giss.nasa.gov/gistemp/" },
      { label: "WMO State of the Global Climate 2024", url: "https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2024" },
    ],
  },
  {
    id: "sea-level",
    kicker: "Sea Level Rise",
    title: "Global mean sea level",
    figures: [
      { value: "~10 cm", label: "risen since 1993, the satellite record" },
      { value: "0.44 cm/yr", label: "long-term rate, more than double 1993's" },
      { value: "0.08 cm", label: "rise in 2025, held back by La Niña" },
      { value: "50%", label: "of the 1971–2018 rise from warming water; glaciers 22%, ice sheets 20%" },
      { value: "0.28–0.55 m", label: "likely rise by 2100 with very low emissions (SSP1-1.9)" },
      { value: "0.63–1.01 m", label: "likely rise by 2100 with very high emissions (SSP5-8.5)" },
    ],
    callout: {
      title: "About 680 million people live in low-lying coastal zones",
      body: "Nearly a tenth of the world's 2010 population, projected to pass one billion by 2050 (IPCC).",
      color: BLUE,
    },
    sources: [
      { label: "NASA, 29 January 2026", url: "https://www.jpl.nasa.gov/news/nasa-analysis-shows-la-nina-limited-sea-level-rise-in-2025/" },
      { label: "IPCC AR6 WG1, Summary for Policymakers", url: "https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/" },
      { label: "IPCC Special Report on the Ocean and Cryosphere", url: "https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/" },
    ],
  },
  {
    id: "ice",
    kicker: "Polar Ice",
    title: "Sea-ice extent, million km²",
    bars: {
      caption: "NSIDC Sea Ice Index, monthly means; the 1981–2010 figures average the index's own values",
      max: 7,
      rows: [
        { label: "Arctic, September 1981–2010", value: 6.41, display: "6.41", color: GREEN },
        { label: "Arctic, September 2025", value: 4.75, display: "4.75", color: CYAN },
        { label: "Arctic, September 2012 (record low)", value: 3.57, display: "3.57", color: RED },
        { label: "Antarctic, February 1981–2010", value: 3.07, display: "3.07", color: GREEN },
        { label: "Antarctic, February 2026", value: 2.91, display: "2.91", color: CYAN },
        { label: "Antarctic, February 2023 (record low)", value: 1.98, display: "1.98", color: RED },
      ],
    },
    callout: {
      title: "The Arctic has warmed nearly four times as fast as the globe since 1979",
      body: "Rantanen et al. 2022.",
      color: DEEP_RED,
    },
    sources: [
      { label: "NSIDC Sea Ice Index (G02135)", url: "https://nsidc.org/data/g02135" },
      { label: "Rantanen et al. 2022", url: "https://doi.org/10.1038/s43247-022-00498-3" },
    ],
  },
  {
    id: "forests",
    kicker: "Deforestation",
    title: "Tropical primary forest loss, 2025",
    figures: [
      { value: "4.3 Mha", label: "tropical primary forest lost in 2025" },
      { value: "−36%", label: "from the record set in 2024" },
      { value: "+46%", label: "above the level a decade earlier" },
      { value: "11", label: "football fields of it a minute" },
      { value: "−41%", label: "Brazil's non-fire loss, its lowest on record" },
      { value: "5,796 km²", label: "cleared in the Legal Amazon, August 2024–July 2025" },
    ],
    sources: [
      {
        label: "WRI Global Forest Watch, 29 April 2026",
        url: "https://www.wri.org/news/release-tropical-rainforest-loss-drops-36-2025-fires-threaten-global-progress",
      },
      { label: "INPE PRODES", url: "https://terrabrasilis.dpi.inpe.br/app/dashboard/deforestation/biomes/legal_amazon/rates" },
    ],
  },
  {
    id: "plastic",
    kicker: "Plastic Pollution",
    title: "Plastic made, wasted and leaked",
    figures: [
      { value: "460 Mt", label: "plastic produced in 2019, double 2000's" },
      { value: "353 Mt", label: "plastic waste in 2019" },
      { value: "9%", label: "of that waste recycled" },
      { value: "30 Mt", label: "accumulated in the ocean" },
      { value: "109 Mt", label: "accumulated in rivers" },
    ],
    bars: {
      caption: "Plastic carried to the ocean by rivers, tonnes a year (Meijer et al. 2021); the Philippines' is 36% of the world's",
      max: 360000,
      rows: [
        ["Philippines", 356371],
        ["India", 126513],
        ["Malaysia", 73098],
        ["China", 70707],
        ["Indonesia", 56333],
      ].map(([label, v]) => ({ label: label as string, value: v as number, display: (v as number).toLocaleString("en-US"), color: BLUE })),
    },
    sources: [
      {
        label: "OECD Global Plastics Outlook (2022)",
        url: "https://www.oecd.org/environment/plastic-pollution-is-growing-relentlessly-as-waste-management-and-recycling-fall-short.htm",
      },
      { label: "Meijer et al. 2021, Science Advances", url: "https://doi.org/10.1126/sciadv.aaz5803" },
      { label: "Our World in Data", url: "https://ourworldindata.org/grapher/plastic-entering-ocean" },
    ],
  },
  {
    id: "renewables",
    kicker: "Clean Energy",
    title: "Renewables' share of electricity",
    bars: {
      caption: "Ember, via Our World in Data; 2025 unless marked",
      max: 100,
      rows: [
        ["Iceland (2024)", 100],
        ["Norway", 99],
        ["Denmark", 91.2],
        ["Germany", 59.1],
        ["China", 37],
        ["World", 33.8],
        ["United States", 25.6],
        ["India", 24.1],
        ["Saudi Arabia (2024)", 2.2],
      ].map(([label, v]) => ({
        label: label as string,
        value: v as number,
        display: `${(v as number).toFixed(1)}%`,
        color: label === "World" ? SLATE : EMERALD,
      })),
    },
    sources: [{ label: "Ember via Our World in Data", url: "https://ourworldindata.org/grapher/share-electricity-renewables" }],
  },
  {
    id: "extremes",
    kicker: "Extreme Weather",
    title: "Natural catastrophes, 2025, and recent disasters",
    figures: [
      { value: "$224bn", label: "losses from natural disasters worldwide in 2025" },
      { value: "$108bn", label: "of them insured" },
      { value: "$53bn", label: "Los Angeles wildfires, January 2025: the year's costliest" },
    ],
    events: [
      { title: "Canada wildfires, 2023", detail: "About 15 million hectares burned, the most in Canada's recorded history" },
      { title: "Valencia floods, October 2024", detail: "233 deaths, the official toll as of September 2026" },
      { title: "Rio Grande do Sul floods, 2024", detail: "183 deaths; more than 420,000 people displaced" },
    ],
    sources: [
      { label: "Munich Re, via France 24, 13 January 2026", url: "https://www.france24.com/en/live-news/20260113-disaster-losses-drop-in-2025-picture-still-alarming-munich-re" },
      { label: "Natural Resources Canada", url: "https://natural-resources.canada.ca/stories/simply-science/canada-s-record-breaking-wildfires-2023-fiery-wake-call" },
      { label: "The Olive Press, 29 September 2026", url: "https://www.theolivepress.es/spain-news/2026/09/29/valencia-2024-flood-disaster-death-toll-goes-up-to-233-people/" },
      { label: "Center for Disaster Philanthropy", url: "https://disasterphilanthropy.org/disasters/2024-rio-grande-do-sul-brazil-floods/" },
    ],
  },
  {
    id: "water",
    kicker: "Water Stress & Access",
    title: "Freshwater security",
    figures: [
      { value: "2.1bn", label: "people without safely managed drinking water, 2024" },
      { value: "3.4bn", label: "without safely managed sanitation, 2024" },
      { value: "74%", label: "with safely managed drinking water, up from 68% in 2015" },
      { value: "~4bn", label: "people facing high water stress at least a month a year" },
      { value: "25", label: "countries, home to a quarter of humanity, under extremely high water stress" },
      { value: "70%", label: "of freshwater use goes to food systems" },
    ],
    callout: {
      title: "The most water-stressed: Bahrain, Cyprus, Kuwait, Lebanon and Oman",
      body: "Extremely high stress means using more than 80% of the renewable supply each year (WRI Aqueduct 4.0).",
      color: AMBER,
    },
    sources: [
      { label: "WHO/UNICEF JMP 2025", url: "https://data.unicef.org/resources/jmp-report-2025/" },
      { label: "WRI Aqueduct 4.0", url: "https://www.wri.org/insights/highest-water-stressed-countries" },
      { label: "UNCCD Global Land Outlook 2", url: "https://www.eurekalert.org/news-releases/950916" },
    ],
  },
  {
    id: "co2",
    kicker: "CO₂ Emissions",
    title: "Fossil CO₂ by emitter, 2024, billion tonnes",
    bars: {
      caption: "Global Carbon Budget 2025, via Our World in Data; share of the world total",
      max: 12.5,
      rows: [
        ["China", 12.29, 31.8],
        ["United States", 4.9, 12.7],
        ["India", 3.19, 8.3],
        ["European Union", 2.43, 6.3],
        ["Russia", 1.78, 4.6],
        ["Japan", 0.96, 2.5],
        ["Indonesia", 0.81, 2.1],
        ["Iran", 0.79, 2.1],
        ["Saudi Arabia", 0.69, 1.8],
        ["South Korea", 0.58, 1.5],
        ["Germany", 0.57, 1.5],
      ].map(([label, v, share]) => ({
        label: label as string,
        value: v as number,
        display: `${(v as number).toFixed(2)} Gt · ${share}%`,
        color: ORANGE,
      })),
    },
    callout: {
      title: "Fossil CO₂ reached a record 38.1 Gt in 2025 (projected)",
      body: "The remaining budget for 1.5°C is 170 Gt, about four years of current emissions (Global Carbon Budget 2025).",
      color: DEEP_RED,
    },
    sources: [
      { label: "Global Carbon Budget 2025", url: "https://globalcarbonbudget.org/fossil-fuel-co2-emissions-hit-record-high-in-2025/" },
      { label: "Our World in Data CO₂ dataset", url: "https://github.com/owid/co2-data" },
    ],
  },
  {
    id: "biodiversity",
    kicker: "Biodiversity",
    title: "Species and wildlife populations",
    figures: [
      { value: "49,500+", label: "species threatened with extinction" },
      { value: "28%", label: "of all species assessed" },
      { value: "−73%", label: "average decline in monitored wildlife populations, 1970–2020" },
      { value: "−85%", label: "freshwater populations" },
      { value: "−95%", label: "Latin America and the Caribbean" },
    ],
    bars: {
      caption: "Share of assessed species threatened, IUCN Red List",
      max: 100,
      rows: [
        ["Cycads", 71],
        ["Reef corals", 44],
        ["Amphibians", 41],
        ["Sharks & rays", 38],
        ["Conifers", 34],
        ["Mammals", 26],
        ["Reptiles", 21],
        ["Birds", 11],
      ].map(([label, v]) => ({ label: label as string, value: v as number, display: `${v}%`, color: ORANGE })),
    },
    sources: [
      { label: "IUCN Red List (2026-1)", url: "https://www.iucnredlist.org/" },
      { label: "WWF Living Planet Report 2024", url: "https://www.worldwildlife.org/publications/2024-living-planet-report/" },
    ],
  },
  {
    id: "food",
    kicker: "Soil & Food Security",
    title: "Land degradation and hunger",
    figures: [
      { value: "673M", label: "people facing hunger in 2024" },
      { value: "8.2%", label: "of the world, down from 8.5% in 2023" },
      { value: "2.3bn", label: "moderately or severely food insecure" },
      { value: "307M", label: "hungry in Africa, more than 20% of its people" },
      { value: "Up to 40%", label: "of the world's land degraded" },
      { value: "$44tn", label: "of economic output, half the world's, at risk from it" },
    ],
    sources: [
      { label: "FAO et al., State of Food Security and Nutrition 2025", url: "https://www.fao.org/newsroom/detail/global-hunger-declines--but-rises-in-africa-and-western-asia--un-report/en" },
      { label: "UNCCD Global Land Outlook 2", url: "https://www.eurekalert.org/news-releases/950916" },
    ],
  },
];

/** Taken off the Climate page, and so off the Climate explorer, as asked: Freshwater security. It is kept above, with its sources, and not shown. */
const OFF_THE_PAGE = new Set(["water"]);
export const FIGURE_CARDS: FigureCard[] = ALL_FIGURE_CARDS.filter((c) => !OFF_THE_PAGE.has(c.id));
