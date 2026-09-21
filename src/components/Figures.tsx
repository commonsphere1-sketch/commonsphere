/**
 * Figures.tsx
 *
 * How a counter's numerals are set on this site, in one place, because two
 * pages now run a clock: the dashboard's quarter tracker and the states
 * banner's election countdown.
 *
 * The face is Playfair Display at 500, the display serif the site already
 * loads. Monospace read as a system readout, and IBM Plex Mono's zero carries
 * a centre dot — a programmer's mark for telling O from 0, which a clock has
 * no use for. Playfair's figures are lining, its zero is a plain oval, and its
 * thick-to-thin contrast makes the stems much narrower than the mono's uniform
 * ones.
 *
 * What the serif costs is tabular figures. Neither Playfair nor DM Sans ships
 * a `tnum` feature — both were measured in the browser — and Playfair's digits
 * run from 0.376em for a 1 to 0.617em for a 0. At one tick a second that
 * jitter is very visible, so <Figures> boxes every digit to the width of the
 * widest one. The layout does what the font will not.
 */

/** The face and weight for a counter's numerals. Colour stays with the caller. */
export const COUNTER_FIGURES: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontWeight: 500,
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

/** The width every digit is boxed to: the widest Playfair figure, its 0. */
const FIGURE_WIDTH = "0.62em";

/** Digits boxed to a common width; punctuation keeps its own. */
export function Figures({ value }: { value: string }) {
  return (
    <>
      {[...value].map((ch, i) =>
        ch >= "0" && ch <= "9" ? (
          <span
            key={i}
            className="inline-block text-center"
            style={{ width: FIGURE_WIDTH }}
          >
            {ch}
          </span>
        ) : (
          <span key={i} style={ch === ":" ? COUNTER_SEP : undefined}>
            {ch}
          </span>
        ),
      )}
    </>
  );
}
