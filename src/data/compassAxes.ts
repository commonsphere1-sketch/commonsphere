/**
 * Axes for the country compass.
 *
 * A classic political compass needs left/right and authoritarian/libertarian
 * scores per country. This dataset has neither: `politicalIdeologies`,
 * `governanceStyle` and `economyType` are declared on the Country interface
 * but populated for no country at all. Rather than invent 204 ideology
 * coordinates and present them as data, both axes are derived from fields
 * that are actually filled in, and are labelled for what they measure.
 *
 * Vertical — how concentrated executive power is, read off `governmentType`,
 * which every country has. This is a reading of constitutional form, not a
 * democracy index: it says where power sits on paper, and says nothing about
 * how freely elections are run or how the state behaves in practice. A
 * country can score low here and still govern badly.
 *
 * Horizontal — GDP per capita, on a log scale because the field spans $233 to
 * $247,950 and a linear axis would pile four fifths of the world into one
 * column.
 *
 * Plotting the two together is not arbitrary: the tendency for dispersed-power
 * states to cluster at high income is a long-standing observation in political
 * economy, and the chart lets you see how well it holds and who sits outside
 * it.
 */

/** 0 = power dispersed across institutions, 10 = concentrated in one office. */
export const AUTHORITY_BY_GOVERNMENT: Record<string, number> = {
  // Power vested in a single ruler or organ, with no competing mandate.
  "Absolute Monarchy": 10,
  "Islamic Emirate": 10,
  "Military Junta": 9.5,
  "Military Council": 9.5,
  "One-Party Socialist Republic": 9,
  "One-Party Republic": 9,

  // Contested or provisional arrangements, where normal checks are suspended.
  "Islamic Republic": 7.5,
  "Transitional Presidential Council": 7.5,
  "Transitional Government": 7,
  "Disputed Territory (Morocco administered)": 7,
  "Federal Monarchy": 6.5,

  // Elected executives holding office independently of the legislature.
  "Presidential Republic": 5,
  "Semi-Presidential Republic": 4.5,
  "Federal Presidential Republic": 4.5,
  "Federal Semi-Presidential Republic": 4.5,

  // Executives that sit inside the legislature and can be removed by it.
  "Federal Republic": 3,
  "Parliamentary Authority": 3,
  "Parliamentary Republic": 2.5,
  "Federal Parliamentary Republic": 2.5,
  "Parliamentary Republic (Diarchy)": 2.5,
  "Constitutional Monarchy": 2.5,
  "Federal Parliamentary Monarchy": 2.5,
  "Parliamentary Co-Principality": 2.5,
  "Parliamentary Democracy": 2,
  "Federal Parliamentary Democracy": 2,
  "Parliamentary Constitutional Monarchy": 2,
  "Federal Council Republic": 2,

  // Territories governed under an external sovereign.
  "Unincorporated US Territory": 3,
  "British Overseas Territory": 3,
  "Autonomous Territory of Denmark": 2.5,
  "Self-governing in Free Association with NZ": 2,
};

/** Fallback for a form not in the table — mid-scale, and flagged in the UI. */
export const AUTHORITY_UNKNOWN = 5;

export function authorityScore(governmentType: string): {
  score: number;
  known: boolean;
} {
  const score = AUTHORITY_BY_GOVERNMENT[governmentType];
  return score === undefined
    ? { score: AUTHORITY_UNKNOWN, known: false }
    : { score, known: true };
}

/** Bands used by the filter and the quadrant labels. */
export const AUTHORITY_BANDS = [
  { id: "dispersed", label: "Dispersed", min: 0, max: 3.4 },
  { id: "executive", label: "Executive-led", min: 3.4, max: 6.6 },
  { id: "concentrated", label: "Concentrated", min: 6.6, max: 10 },
] as const;

export type AuthorityBandId = (typeof AUTHORITY_BANDS)[number]["id"];

export function authorityBand(score: number): AuthorityBandId {
  for (const b of AUTHORITY_BANDS) {
    if (score >= b.min && score <= b.max) return b.id;
  }
  return "executive";
}
