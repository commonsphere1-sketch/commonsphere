/**
 * The blue hue: the wash across the US States page's national banner and
 * across every headlines banner - deep in dark mode, soft in light. It is a
 * background image, so it paints over a panel's own card colour and follows
 * the panel's corners; a panel carrying it also takes `cs-on-hue`
 * (index.css), which sets its quiet text and hairlines a step stronger.
 *
 * Written out in full, not built from parts, because Tailwind only generates
 * classes it can find as whole strings in the source.
 */
export const BLUE_HUE =
  "bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-blue-700/20 dark:from-blue-900/70 dark:via-cyan-800/50 dark:to-blue-900/70";
