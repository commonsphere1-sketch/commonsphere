/**
 * The commodities the site follows: each one's name, which keys its data
 * files (prices, producers, details), and the colour it is drawn in. On its
 * own so the Economies page and the Dashboard's explorer can both list them
 * without one loading the other.
 */
export interface ResourceSummary {
  name: string;
  color: string;
}

export const RESOURCES: ResourceSummary[] = [
  { name: "Crude Oil", color: "#f97316" },
  { name: "Natural Gas", color: "#6366f1" },
  { name: "Gold", color: "#f59e0b" },
  { name: "Coal", color: "#6b7280" },
  { name: "Iron Ore", color: "#b45309" },
  { name: "Copper", color: "#dc2626" },
  { name: "Lithium", color: "#7c3aed" },
  { name: "Wheat", color: "#ca8a04" },
  { name: "Rare Earth", color: "#059669" },
  { name: "Uranium", color: "#65a30d" },
  // Slate greys dark enough to draw a line with on the light card.
  { name: "Aluminum", color: "#64748b" },
  { name: "Silver", color: "#8492a6" },
];
