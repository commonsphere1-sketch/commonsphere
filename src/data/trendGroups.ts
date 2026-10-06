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

/** The headline projections the Trends page gives as cards, beside the trends. The page checks this against what it builds. */
export const PROJECTION_FIGURES = 8;
/** Every figure the Trends explorer lists: the projections and the trends. */
export const TREND_FIGURES = PROJECTION_FIGURES + TREND_GROUPS.reduce((n, g) => n + g.ids.length, 0);
