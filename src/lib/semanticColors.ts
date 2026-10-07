/**
 * The colour of a thing that has one: a bar or an arc that stands for coal,
 * the sun, a forest, a party or a sex is drawn in the colour a reader already
 * gives it, wherever on the site it is drawn.
 *
 * The charts took their colours from their place in a list - the first part
 * amber, the second blue - or were all the site's one accent, so nuclear
 * power was the same violet as coal beside it and solar could be blue in one
 * window and green in the next. A chart's shared pieces (ModalCharts) now ask
 * here first: a row or a part whose name is one of these takes its colour,
 * and only what has no colour of its own falls back to the chart's.
 *
 * A name is matched whole, not in passing: "Gas" and "Natural gas" are gas,
 * "Gas rents" is not. The colours are mid-tones that read on the dark cards
 * and the light ones, and the figures beside them stay in ink - a colour
 * says which thing a bar is, never how much.
 */

const RULES: [RegExp, string][] = [
  // ── Energy: where power and fuel come from ──
  [/^(coal|coal and coke|lignite|peat)$/, "#78716c"],
  [/^(oil|petroleum|crude oil|oil and petroleum|petroleum liquids|petroleum and other liquids|oil & other liquids)$/, "#a16207"],
  [/^(natural gas|gas|fossil gas)$/, "#f97316"],
  [/^(fossil fuels?)$/, "#8d6e63"],
  [/^(nuclear|nuclear power)$/, "#a855f7"],
  [/^(hydro|hydropower|hydroelectric|hydroelectricity|hydroelectric power|conventional hydroelectric)$/, "#3b82f6"],
  [/^(wind|wind power|onshore wind|offshore wind)$/, "#14b8a6"],
  [/^(solar|solar power|solar pv|solar photovoltaic|solar thermal)$/, "#eab308"],
  [/^(biomass|bioenergy|biofuels?|biomass and waste|wood|wood and wood-derived fuels)$/, "#84cc16"],
  [/^(geothermal)$/, "#ef4444"],
  [/^(renewables?|other renewables?|renewable energy|renewables & other)$/, "#22c55e"],
  // ── Land: what it is under ──
  [/^(forest|forests|forest land|forest cover|woodland)$/, "#16a34a"],
  [/^(agricultural land|agriculture|farmland|cropland|arable land|arable|permanent crops|farming)$/, "#ca8a04"],
  [/^(pasture|permanent pasture|permanent meadows and pastures|grassland|grazing land|rangeland)$/, "#a3e635"],
  [/^(urban|built-up|built-up land|built-up area|urban and built-up)$/, "#94a3b8"],
  [/^(water|inland water|water bodies)$/, "#0ea5e9"],
  [/^(desert|barren|barren land|bare ground)$/, "#d6a56a"],
  // ── The parts of an economy ──
  [/^(industry|industry \(incl\. construction\))$/, "#f59e0b"],
  [/^(manufacturing)$/, "#d97706"],
  [/^(services)$/, "#3b82f6"],
  [/^(construction)$/, "#a16207"],
  [/^(mining|mining and quarrying|mining, construction & utilities)$/, "#78716c"],
  // ── Offences: each its own, wherever it is drawn ──
  [/^(intentional homicides?|homicides?|murder)$/, "#dc2626"],
  [/^(robbery)$/, "#f97316"],
  [/^(serious assault|assault)$/, "#a855f7"],
  [/^(burglary)$/, "#b45309"],
  [/^(vehicle theft|theft of a motorized vehicle|car theft)$/, "#3b82f6"],
  [/^(theft)$/, "#0d9488"],
  [/^(kidnapping)$/, "#be185d"],
  [/^(sexual violence|rape)$/, "#9333ea"],
  [/^(fraud)$/, "#ca8a04"],
  [/^(corruption|bribery)$/, "#65a30d"],
  // ── People ──
  [/^(men|male|males|boys)$/, "#3b82f6"],
  [/^(women|female|females|girls)$/, "#ec4899"],
  // ── US parties, by the colours they are shown in everywhere ──
  [/^(democrat|democrats|democratic|democratic party)$/, "#3b82f6"],
  [/^(republican|republicans|republican party)$/, "#ef4444"],
  [/^(independent|independents)$/, "#94a3b8"],
  // ── Getting to work ──
  [/^(car, truck or van|drive|drove alone|car)$/, "#64748b"],
  [/^(public transit|transit|public transport)$/, "#8b5cf6"],
  [/^(walk or bike|walked|walk|bicycle)$/, "#22c55e"],
  [/^(work from home|worked from home)$/, "#f59e0b"],
  // ── What is left over, in any list ──
  [/^(other|others|other sources|other land|all other|not given|unknown)$/, "#94a3b8"],
];

const memo = new Map<string, string | null>();

/** The colour a named thing has of its own, or null where it has none and takes its chart's. */
export function semanticColor(label: string): string | null {
  const key = label.trim().toLowerCase();
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  const found = RULES.find(([re]) => re.test(key))?.[1] ?? null;
  memo.set(key, found);
  return found;
}
