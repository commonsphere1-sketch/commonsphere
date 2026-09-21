/**
 * Figures.tsx
 *
 * How a counter's numerals are set on this site, in one place, because two
 * pages run a clock: the dashboard's quarter tracker and the states banner's
 * election countdown.
 *
 * The face is Spectral at 500. Monospace read as a system readout, and IBM
 * Plex Mono's zero carries a centre dot — a programmer's mark for telling O
 * from 0, which a clock has no use for. Spectral is a serif with the contrast
 * to look considered, a plain oval zero, and — the reason it is this serif and
 * not another — figures that are all one width already.
 *
 * That last part matters more than it sounds. Playfair, which this replaced,
 * has no `tnum` feature and runs from 0.376em for a 1 to 0.617em for a 0, so
 * every digit had to be boxed to a common width in the markup. It held still,
 * but a boxed 1 floats in its box with a gap either side while a 0 fills it,
 * and the spacing came out visibly uneven. Spectral needs none of that: every
 * digit is 0.516em in the font itself, so the numbers are even because the
 * typeface makes them even. Measured in the browser; Source Serif 4 and IBM
 * Plex Serif are the other two that do this, should this one ever go.
 */

/** The face and weight for a counter's numerals. Colour stays with the caller. */
export const COUNTER_FIGURES: React.CSSProperties = {
  fontFamily: '"Spectral", Georgia, serif',
  fontWeight: 500,
  // Belt and braces: the figures are already one width, and this keeps them
  // that way if the face ever falls back to Georgia.
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "0.015em",
};

/** A trailing unit — "d", "%" — set back so the numerals carry the line. */
export const COUNTER_UNIT: React.CSSProperties = {
  fontSize: "0.42em",
  opacity: 0.5,
  marginLeft: "0.14em",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

/** The colons between hours, minutes and seconds. */
export const COUNTER_SEP: React.CSSProperties = { opacity: 0.32, padding: "0 0.02em" };

/**
 * A counter's digits, with the colons set back from them.
 *
 * It used to box each digit to a fixed width, which the face no longer needs.
 * It stays because it is what dims the separators, and because both counters
 * already call it.
 */
export function Figures({ value }: { value: string }) {
  return (
    <>
      {[...value].map((ch, i) =>
        ch === ":" ? (
          <span key={i} style={COUNTER_SEP}>
            {ch}
          </span>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  );
}
