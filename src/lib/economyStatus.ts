/**
 * The degree of inflation an economy is at, read off one published figure
 * against another: its consumer-price inflation for its latest year, and the
 * world's for the same year.
 *
 *   falling   prices fell over the year
 *   below     prices rose, by less than the world's rate
 *   above     prices rose by the world's rate or more, up to twice it
 *   high      prices rose by more than twice the world's rate
 *   unknown   no inflation figure is published for it, or none for the
 *             world that year
 *
 * Both figures are the World Bank's (inflation, consumer prices, annual per
 * cent; the world's is the median of its economies). The dividing lines are
 * zero, the world's own rate and twice it: the first two are the figures
 * themselves, and the third is the site's way of setting far above apart
 * from above, said in the key so it is not mistaken for anybody's standard.
 * It reads prices alone: growth, jobs and debt are the figures on each card.
 *
 * Each degree carries the colour of the tab down its card's left side - the
 * edge the Worldview's pillars have - and the tone of the chip that names it,
 * so no card says its degree by colour alone. The colour washed the whole
 * card at first; it was moved to the tab as asked.
 */
import { WORLD } from "../data/worldview";
import { TONE } from "./chipTone";

export type EconomyStatusKey = "falling" | "below" | "above" | "high" | "unknown";

export type EconomyStatus = {
  key: EconomyStatusKey;
  /** The degree, in a few words: the chip on the card. */
  label: string;
  /** The two figures behind it, in a sentence. */
  detail: string;
  /** The colour of the tab down the card's left side. */
  edge: string;
  /** The chip's colours, light and dark. */
  chip: string;
};

/* The chip's own family of colour, at the strength a 3px edge needs to be seen on a dark card and a light one. */
const EDGE: Record<EconomyStatusKey, string> = { falling: "#0ea5e9", below: "#10b981", above: "#f59e0b", high: "#f43f5e", unknown: "#94a3b8" };
const CHIP: Record<EconomyStatusKey, string> = { falling: TONE.sky, below: TONE.emerald, above: TONE.amber, high: TONE.rose, unknown: TONE.slate };

/** What each degree means, for the key above the cards, lowest first. */
export const ECONOMY_STATUS_KEY: { key: EconomyStatusKey; label: string; means: string; edge: string; chip: string }[] = [
  { key: "falling", label: "Prices falling", means: "consumer prices fell over the year", edge: EDGE.falling, chip: CHIP.falling },
  { key: "below", label: "Inflation below the world's", means: "prices rose by less than the world's rate", edge: EDGE.below, chip: CHIP.below },
  { key: "above", label: "Inflation above the world's", means: "prices rose by the world's rate or more, up to twice it", edge: EDGE.above, chip: CHIP.above },
  { key: "high", label: "Inflation over twice the world's", means: "prices rose by more than twice the world's rate", edge: EDGE.high, chip: CHIP.high },
  { key: "unknown", label: "No inflation figure", means: "none is published for it", edge: EDGE.unknown, chip: CHIP.unknown },
];

const rate = (v: number) => `${Math.abs(v).toFixed(1)}%`;

/** The world's consumer-price inflation for a year, where the World Bank series holds it. */
export const worldInflation = (year: string | number | undefined): number | null =>
  year == null ? null : (WORLD.inflation?.series.find(([y]) => String(y) === String(year))?.[1] ?? null);

/** An economy's degree of inflation, from its inflation rate and the year that figure is for. */
export function economyStatus(inflation: number | undefined, year: string | undefined): EconomyStatus {
  const of = (key: EconomyStatusKey, label: string, detail: string): EconomyStatus => ({ key, label, detail, edge: EDGE[key], chip: CHIP[key] });
  if (inflation == null || !Number.isFinite(inflation)) return of("unknown", "No inflation figure", "No consumer-price inflation figure is published for this economy.");
  const when = year ? ` in ${year}` : "";
  if (inflation < 0) return of("falling", "Prices falling", `Its consumer prices fell ${rate(inflation)}${when}.`);
  const world = worldInflation(year);
  if (world == null || world <= 0) return of("unknown", `Inflation ${rate(inflation)}`, `Its consumer prices rose ${rate(inflation)}${when}; the World Bank has no world figure for that year to set it against.`);
  const said = `Its consumer prices rose ${rate(inflation)}${when}; the world's rose ${rate(world)}.`;
  if (inflation < world) return of("below", "Inflation below the world's", said);
  if (inflation <= 2 * world) return of("above", "Inflation above the world's", said);
  return of("high", "Inflation over twice the world's", `${said} That is ${(inflation / world).toFixed(1)} times the world's rate.`);
}
