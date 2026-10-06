/**
 * The Human Development Index's four tiers, as the UNDP sets them: very high
 * from 0.800, high from 0.700, medium from 0.550, low below that.
 *
 * The site's HDI chips were coloured by cut-offs of its own - 0.9, 0.8 and
 * 0.7 on one page, 0.8 and 0.65 on another - so the same country could be
 * green on the Countries page and amber on the Dashboard, and neither line
 * was anybody's. Every chip takes its colour from the UNDP's tier now, and
 * can say which tier it is.
 */
import { TONE } from "./chipTone";

export type HdiTier = {
  name: "Very high" | "High" | "Medium" | "Low";
  /** The index value the tier starts at. */
  from: number;
  /** A chip's classes, light and dark. */
  tone: string;
  /** The same colour for a chip drawn with inline styles. */
  hex: string;
};

export const HDI_TIERS: HdiTier[] = [
  { name: "Very high", from: 0.8, tone: TONE.green, hex: "#10b981" },
  { name: "High", from: 0.7, tone: TONE.teal, hex: "#14b8a6" },
  { name: "Medium", from: 0.55, tone: TONE.yellow, hex: "#f59e0b" },
  { name: "Low", from: 0, tone: TONE.orange, hex: "#f97316" },
];

/** The tier an index value falls in, or null where none is published. */
export const hdiTierOf = (v: number | null | undefined): HdiTier | null => (typeof v === "number" && Number.isFinite(v) ? (HDI_TIERS.find((t) => v >= t.from) ?? null) : null);

/** A chip's classes for an index value: its tier's, or a quiet chip where none is published. */
export const hdiTone = (v: number | null | undefined) => hdiTierOf(v)?.tone ?? "border border-border bg-muted text-muted-foreground";

/** The colour for an inline-styled chip. */
export const hdiHex = (v: number | null | undefined) => hdiTierOf(v)?.hex ?? "#9ca3af";

/** What a chip says when pointed at: the tier, and whose it is. */
export const hdiTitle = (v: number | null | undefined) => {
  const t = hdiTierOf(v);
  return t ? `${t.name} human development: the UNDP's tier for an index ${t.from > 0 ? `of ${t.from.toFixed(3)} or more` : "below 0.550"}` : "The UNDP publishes no Human Development Index for this place";
};
