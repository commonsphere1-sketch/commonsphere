import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * LocaleContext
 *
 * Controls the language the *data* is presented in. Two things are genuinely
 * localized, both from data the browser already ships:
 *
 *   - Country and region names, via Intl.DisplayNames. Passing an ISO alpha-2
 *     code returns the name in the chosen language — "Germany" becomes
 *     "Allemagne" or "Alemania" — using CLDR, not a translation table we
 *     maintain.
 *   - Numbers, currency and dates, via Intl.NumberFormat / DateTimeFormat, so
 *     grouping and decimal separators follow the locale: 1,234.5 against
 *     1.234,5 against 1 234,5.
 *
 * What this deliberately does NOT do is translate free text. Notes, policy
 * descriptions and legal-status explanations are English source strings, and
 * machine-translating them silently would be worse than leaving them readable
 * and obviously English. The settings UI says so rather than implying the whole
 * app is translated.
 */

export interface LocaleOption {
  code: string;
  /** Name in the language itself, which is what a speaker looks for. */
  endonym: string;
  english: string;
}

export const LOCALES: LocaleOption[] = [
  { code: "en", endonym: "English", english: "English" },
  { code: "es", endonym: "Español", english: "Spanish" },
  { code: "fr", endonym: "Français", english: "French" },
  { code: "de", endonym: "Deutsch", english: "German" },
  { code: "pt", endonym: "Português", english: "Portuguese" },
  { code: "it", endonym: "Italiano", english: "Italian" },
  { code: "nl", endonym: "Nederlands", english: "Dutch" },
  { code: "pl", endonym: "Polski", english: "Polish" },
  { code: "tr", endonym: "Türkçe", english: "Turkish" },
  { code: "ru", endonym: "Русский", english: "Russian" },
  { code: "ar", endonym: "العربية", english: "Arabic" },
  { code: "hi", endonym: "हिन्दी", english: "Hindi" },
  { code: "zh", endonym: "中文", english: "Chinese" },
  { code: "ja", endonym: "日本語", english: "Japanese" },
  { code: "ko", endonym: "한국어", english: "Korean" },
];

const STORAGE_KEY = "cs-locale";

interface LocaleContextValue {
  locale: string;
  setLocale: (code: string) => void;
  /** Country name in the active locale, falling back to the supplied name. */
  regionName: (alpha2: string, fallback: string) => string;
  formatNumber: (n: number, opts?: Intl.NumberFormatOptions) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  regionName: (_a, fallback) => fallback,
  formatNumber: (n) => String(n),
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // storage blocked; the choice still applies for this session
    }
    // Keeps the document language in step for screen readers and hyphenation.
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (code: string) => setLocaleState(code);

  // Built once per locale rather than per call — these are not cheap.
  const [displayNames, setDisplayNames] = useState<Intl.DisplayNames | null>(
    null,
  );
  useEffect(() => {
    try {
      setDisplayNames(new Intl.DisplayNames([locale], { type: "region" }));
    } catch {
      setDisplayNames(null);
    }
  }, [locale]);

  const regionName = (alpha2: string, fallback: string) => {
    if (!displayNames || !/^[A-Za-z]{2}$/.test(alpha2)) return fallback;
    try {
      return displayNames.of(alpha2.toUpperCase()) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const formatNumber = (n: number, opts?: Intl.NumberFormatOptions) => {
    try {
      return new Intl.NumberFormat(locale, opts).format(n);
    } catch {
      return String(n);
    }
  };

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, regionName, formatNumber }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
