/**
 * The Climate page's "Life on Earth" cards: species found and species lost,
 * ecosystems recovering and dying, and what ecological projects have done.
 * Each figure is taken from the source its card links to and dated to the
 * period the source gives. Read from the sources on 7 October 2026.
 *
 * Where each is from:
 *
 *   Catalogue of Life              The species in its September 2026 release
 *     (CC BY 4.0)                  (counted by its own interface), and its
 *                                  own estimate of living species.
 *   Li, Yang, Wang & Wiens 2025,   New species described a year, 2015-2020,
 *     Science Advances             and extinctions recorded a year.
 *   Planetary Health Check 2026    The extinction rate against its boundary
 *                                  (planetaryBoundaries.ts).
 *   US Fish and Wildlife Service   Species delisted as extinct and recovered;
 *                                  the bald eagle.
 *   FAO, Global Forest Resources   Forest area, deforestation, net loss,
 *     Assessment 2025              expansion, protection and fire.
 *   NOAA Coral Reef Watch          The fourth global coral bleaching event.
 *   NASA Ozone Watch               The Antarctic ozone hole's mean area, year
 *                                  by year.
 *   UNEP / WMO, 2023               What the Montreal Protocol has done.
 *   UNCCD                          The Great Green Wall's goals.
 *   World Bank                     Land and waters protected (worldview.ts).
 *
 * What is not here, because no source open to this site gives it: a count of
 * the species declared extinct worldwide (the IUCN Red List's own tables
 * could not be read by this build, and its data are not licensed for a
 * commercial site), the hectares the Great Green Wall has restored so far
 * (the UNCCD's page gives none), and any single figure for "ecosystems
 * recovered" - there is none, so recovery is given ecosystem by ecosystem.
 */
import type { FigureCard } from "./climateFigures";
import { BOUNDARIES, PHC_2026 } from "./planetaryBoundaries";
import { WORLD } from "./worldview";

export const LIFE_CHECKED = "7 October 2026";

const GREEN = "#22c55e";
const EMERALD = "#10b981";
const BLUE = "#3b82f6";

const SRC = {
  col: { label: "Catalogue of Life, release of 11 September 2026", url: "https://doi.org/10.48580/dgz5n" },
  wiens: { label: "Li, Yang, Wang & Wiens 2025, Science Advances", url: "https://doi.org/10.1126/sciadv.adz3071" },
  phc: { label: PHC_2026.title, url: PHC_2026.summaryUrl },
  fwsExtinct: { label: "US Fish and Wildlife Service, 16 October 2023", url: "https://www.fws.gov/press-release/2023-10/21-species-delisted-endangered-species-act-due-extinction" },
  fwsEagle: { label: "US Fish and Wildlife Service: bald eagle", url: "https://www.fws.gov/species/bald-eagle-haliaeetus-leucocephalus" },
  fra: { label: "FAO, Global Forest Resources Assessment 2025", url: "https://www.fao.org/newsroom/detail/global-deforestation-slows--but-forests-remain-under-pressure--fao-report-shows/en" },
  coral: { label: "NOAA Coral Reef Watch: the fourth global bleaching event", url: "https://coralreefwatch.noaa.gov/satellite/research/coral_bleaching_report.php" },
  ozone: { label: "NASA Ozone Watch: annual records", url: "https://ozonewatch.gsfc.nasa.gov/statistics/annual_data.txt" },
  unep: { label: "UNEP / WMO, Scientific Assessment of Ozone Depletion, 9 January 2023", url: "https://www.unep.org/news-and-stories/press-release/ozone-layer-recovery-track-helping-avoid-global-warming-05degc" },
  ggw: { label: "UNCCD: the Great Green Wall Initiative", url: "https://www.unccd.int/our-work/ggwi" },
  target3: { label: "CBD: Target 3", url: "https://www.cbd.int/gbf/targets/3" },
};

/** The extinction rate and its boundary, as the Planetary Health Check gives them. */
const extinction = BOUNDARIES.find((b) => b.id === "biosphere")?.variables.find((v) => v.unit === "E/MSY");
/** The latest of a world series, printed with its year. */
const latest = (id: string) => {
  const s = WORLD[id]?.series;
  return s?.length ? { value: s[s.length - 1][1], year: s[s.length - 1][0] } : null;
};
const land = latest("protectedLand");
const sea = latest("protectedSea");

/** NASA Ozone Watch: the ozone hole's mean area, 7 September to 13 October, million km². */
const OZONE_HOLE: [string, number][] = [
  ["1980", 1.4],
  ["1990", 19.2],
  ["2000", 24.8],
  ["2006, the largest", 26.6],
  ["2015", 25.6],
  ["2020", 23.5],
  ["2025", 18.7],
];

export const LIFE_CARDS: FigureCard[] = [
  {
    id: "species-found",
    kicker: "Species Discovered",
    title: "Species named by science",
    figures: [
      { value: "2,269,433", label: "species in the Catalogue of Life, September 2026" },
      { value: "171,616", label: "of them marked extinct in the Catalogue" },
      { value: "2.3M", label: "living species taxonomists recognise, by the Catalogue's estimate" },
      { value: "80%+", label: "of the world's known species it holds so far" },
      { value: "16,000+", label: "new species described a year, 2015–2020" },
      { value: "~10", label: "extinctions a year, as the same study counts them" },
    ],
    bars: {
      caption: "New species described a year, 2015–2020",
      max: 12000,
      rows: [
        { label: "Animals, mostly arthropods and insects", value: 10000, display: "10,000+", color: EMERALD },
        { label: "Plants", value: 2500, display: "about 2,500", color: GREEN },
        { label: "Fungi", value: 2000, display: "about 2,000", color: BLUE },
      ],
    },
    callout: {
      title: "Discovery is speeding up, not slowing.",
      body: "Li, Yang, Wang and Wiens find that the pace of new descriptions has accelerated: the years with the most new species all fall in the last twenty of their record, 2000 to 2020.",
      color: EMERALD,
    },
    sources: [SRC.col, SRC.wiens],
  },
  {
    id: "species-lost",
    kicker: "Extinction",
    title: "Species lost",
    figures: [
      ...(extinction ? [{ value: extinction.current, label: `extinctions per million species-years now, against a boundary of ${extinction.boundary}` }] : []),
      { value: "21", label: "species the United States delisted as extinct, October 2023" },
      { value: "99%", label: "of species listed under the US Endangered Species Act saved from extinction, by the Service's own account" },
      { value: "100+", label: "US species delisted on recovery, or moved from endangered to threatened" },
    ],
    callout: {
      title: "No count of the world's extinct species is given here.",
      body: "The IUCN Red List keeps one; its tables could not be read for this page, so no figure is put in their place. The Biodiversity card on this page gives the Red List's count of species threatened, with its link.",
      color: "#f97316",
    },
    sources: [SRC.phc, SRC.fwsExtinct],
  },
  {
    id: "ecosystems",
    kicker: "Ecosystems",
    title: "Ecosystems recovering and dying",
    figures: [
      { value: "4.14bn ha", label: "of forest, about a third of the land" },
      { value: "10.9 Mha", label: "deforested a year, 2015–2025, down from 17.6 Mha in 1990–2000" },
      { value: "4.12 Mha", label: "net forest lost a year, 2015–2025, down from 10.7 Mha in the 1990s" },
      { value: "6.78 Mha", label: "of forest gained a year, 2015–2025, down from 9.88 Mha in 2000–2015" },
      { value: "261 Mha", label: "of land burned in an average year, nearly half of it forest" },
      { value: "84.4%", label: "of the world's coral reef area under bleaching-level heat, January 2023–September 2025" },
      { value: "68.2%", label: "in the previous record bleaching event, 2014–2017" },
    ],
    bars: {
      caption: "Antarctic ozone hole, mean area 7 September–13 October, million km²",
      max: 30,
      rows: OZONE_HOLE.map(([label, v]) => ({ label, value: v, display: String(v), color: BLUE })),
    },
    callout: {
      title: "The fourth global coral bleaching event is the biggest to date.",
      body: "NOAA confirmed it on 15 April 2024; mass bleaching has been documented in at least 83 countries and territories. The first and second were in 1998 and 2010.",
      color: "#ef4444",
    },
    sources: [SRC.fra, SRC.coral, SRC.ozone],
  },
  {
    id: "restoration",
    kicker: "Ecological Projects",
    title: "What was done, and what it did",
    events: [
      {
        title: "The Montreal Protocol",
        detail:
          "Nearly 99% of banned ozone-depleting substances have been phased out. The ozone layer is expected to return to its 1980 values by around 2066 over the Antarctic, by 2045 over the Arctic and by 2040 elsewhere; its Kigali Amendment is estimated to avoid 0.3–0.5°C of warming by 2100.",
      },
      {
        title: "The US Endangered Species Act",
        detail:
          "The Fish and Wildlife Service credits it with saving 99% of listed species from extinction. More than 100 species have been delisted on recovery or moved from endangered to threatened; 21 were delisted as extinct in 2023.",
      },
      {
        title: "The bald eagle, United States",
        detail: "417 nesting pairs were known in 1963. In 2018–2019 the lower 48 states held 71,467 breeding pairs and 316,700 birds. It left the endangered list on 28 June 2007.",
      },
      {
        title: "Protected areas: 30% by 2030",
        detail: `Target 3 of the Kunming-Montreal framework is at least 30% of land, inland water and coastal and marine areas conserved by 2030.${
          land && sea ? ` Protected so far: ${land.value}% of land (${land.year}) and ${sea.value}% of territorial waters (${sea.year}), by the World Bank's figures.` : ""
        }`,
      },
      {
        title: "Forests protected, managed and planted",
        detail: "About 20% of forests, 813 million hectares, lie in legally established protected areas; 55%, 2.13 billion hectares, are under management plans; planted forests cover 312 million hectares, about 8% of the total.",
      },
      {
        title: "The Great Green Wall, Africa",
        detail:
          "Launched by the African Union in 2007 across 22 countries and 8,000 km. Its goals for 2030: 100 million hectares of degraded land restored, 250 million tonnes of carbon stored, 10 million green jobs. More than US$14bn has been raised and pledged; the UNCCD's page gives no figure for land restored so far, and none is given here.",
      },
    ],
    sources: [SRC.unep, SRC.fwsExtinct, SRC.fwsEagle, SRC.target3, ...(land && WORLD.protectedLand ? [WORLD.protectedLand.source] : []), SRC.fra, SRC.ggw],
  },
];
