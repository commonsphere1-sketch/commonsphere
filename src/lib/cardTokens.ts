import { useTheme } from "../contexts/ThemeContext";

/** The accent of a card's furniture - its icon tile, count pill, tabs, chips and "All … →" link: black and white, as asked,
 *  as on the other pages - the ink of the cards' headings (headText below), black in the light theme and white in the dark.
 *  It was purple, then powder blue and the headlines' blue. */
export const cardAccent = (isLight: boolean) => (isLight ? "#0f172a" : "#f1f0ff");

/** The site's card colours, light and dark: the cards, their text, their grid lines and tooltips - one set for every chart card. */
export function useTokens() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return {
    isLight,
    cardBg: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
    cardBorder: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.14)",
    cardShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
    mutedText: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)",
    bodyText: isLight ? "#1e293b" : "#e2e8f0",
    headText: isLight ? "#0f172a" : "#f1f0ff",
    gridLine: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)",
    tile: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
    tooltipBg: isLight ? "#ffffff" : "#1a1730",
    /** A card's accent: its icon, badge and links - the headings' ink. */
    accent: cardAccent(isLight),
  };
}
export type Tokens = ReturnType<typeof useTokens>;
