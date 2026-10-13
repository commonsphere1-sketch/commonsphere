/**
 * A country's name in English, by its ISO code: the browser's own, and where
 * the browser has none, the name given as a fallback or the code itself.
 */
const REGION = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

export function regionName(code: string, fallback?: string): string {
  try {
    return REGION?.of(code) ?? fallback ?? code;
  } catch {
    return fallback ?? code;
  }
}
