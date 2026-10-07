/**
 * The measures the Trends page follows, by the part of the world they
 * describe: each id is a world series in worldview.ts or trendDetails.ts.
 * On its own so the Dashboard's explorer can count them without loading the
 * Trends page.
 */
export interface TrendGroup {
  id: string;
  /** The group's name on the page's section bar. */
  nav: string;
  title: string;
  kicker: string;
  color: string;
  ids: string[];
}

export const TREND_GROUPS: TrendGroup[] = [
  { id: "trend-energy", nav: "Energy", title: "Energy", kicker: "What the world runs on", color: "#10b981", ids: ["renewableElectricity", "fossilShare", "evSalesShare", "co2"] },
  { id: "trend-technology", nav: "Technology", title: "Technology", kicker: "What people and firms are taking up", color: "#8b5cf6", ids: ["internet", "broadband", "mobile", "secureServers", "aiInvestment", "genAiInvestment", "robotInstalls", "robotStock"] },
  { id: "trend-research", nav: "Research & development", title: "Research and development", kicker: "What is spent on finding things out, and what comes of it", color: "#06b6d4", ids: ["research", "researchers", "sciArticles", "aiPublications", "patents", "ipReceipts", "spaceLaunches", "nuclearElectricity"] },
  {
    id: "trend-relations",
    nav: "International relations",
    title: "International relations",
    kicker: "War and peace, arms, movement and money between countries",
    color: "#ef4444",
    ids: ["conflicts", "conflictDeaths", "militaryUsd", "militaryGdp", "armsTransfers", "nuclearWarheads", "displaced", "remittances"],
  },
  { id: "trend-industry", nav: "Industry & trade", title: "Industry and trade", kicker: "What the world makes and sells", color: "#f59e0b", ids: ["trade", "manufacturingVA", "servicesVA", "highTechExports"] },
  { id: "trend-people", nav: "People", title: "People", kicker: "How long people live, where, and on what", color: "#3b82f6", ids: ["lifeExpectancy", "extremePoverty", "urban", "aged65"] },
];

/**
 * The same kind of series set out by industry, for the Industries tab of the
 * Dashboard's explorer: what each industry makes or earns, who works in it
 * and what it trades. Each id is a world series in worldview.ts or
 * trendDetails.ts, as above; an industry here is a heading over published
 * series, not a figure of its own.
 */
export const INDUSTRY_GROUPS: TrendGroup[] = [
  { id: "industry-manufacturing", nav: "Manufacturing", title: "Manufacturing", kicker: "What the world's factories add, who works in industry, and the robots beside them", color: "#06b6d4", ids: ["manufacturingUsd", "manufacturingVA", "industryEmployment", "robotInstalls", "robotStock"] },
  { id: "industry-energy", nav: "Energy", title: "Energy", kicker: "What is pumped and generated, and what people use", color: "#10b981", ids: ["oilProduction", "renewableElectricity", "fossilShare", "evSalesShare", "energyPerPerson", "electricityPerPerson"] },
  { id: "industry-technology", nav: "Technology", title: "Technology", kicker: "What is invested, patented and sold", color: "#8b5cf6", ids: ["aiInvestment", "genAiInvestment", "highTechExports", "ictGoodsExports", "secureServers", "patents"] },
  { id: "industry-services", nav: "Services", title: "Services", kicker: "The larger half of the world's output and work", color: "#3b82f6", ids: ["servicesVA", "servicesEmployment", "ictServiceExports", "airPassengers"] },
  { id: "industry-farming", nav: "Farming", title: "Farming", kicker: "Its share of output, and of work", color: "#84cc16", ids: ["agricultureVA", "agEmployment"] },
  { id: "industry-defence", nav: "Defence", title: "Defence", kicker: "What is spent on armed forces, and the arms that cross borders", color: "#ef4444", ids: ["militaryUsd", "militaryGdp", "armsTransfers"] },
  { id: "industry-finance", nav: "Finance and trade", title: "Finance and trade", kicker: "What is traded, invested, listed and sent home", color: "#f59e0b", ids: ["trade", "marketCap", "investment", "remittances"] },
];
/** Every figure the Industries tab lists. The Trends page checks this against what it builds. */
export const INDUSTRY_FIGURES = INDUSTRY_GROUPS.reduce((n, g) => n + g.ids.length, 0);

/** The headline projections the Trends page gives as cards, beside the trends. The page checks this against what it builds. */
export const PROJECTION_FIGURES = 8;
/** Every figure the Trends explorer lists: the projections and the trends. */
export const TREND_FIGURES = PROJECTION_FIGURES + TREND_GROUPS.reduce((n, g) => n + g.ids.length, 0);
