"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, getLocale, getValueByPath, LOCALES } from "@/src/i18n";

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: () => "",
});

const STORAGE_KEY = "site-language";

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALES[stored]) {
      setLanguageState(stored);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === "bn" ? "bn" : "en";
  }, [hydrated, language]);

  const setLanguage = (nextLanguage) => {
    setLanguageState(LOCALES[nextLanguage] ? nextLanguage : DEFAULT_LANGUAGE);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "bn" ? "en" : "bn"));
  };

  const locale = useMemo(() => getLocale(language), [language]);

  const t = (path, fallback = "", values = null) => {
    let actualFallback = fallback;
    let actualValues = values;
    
    // Support t("key", { param: "value" }) shorthand where fallback is omitted
    if (typeof fallback === "object" && fallback !== null) {
      actualValues = fallback;
      actualFallback = "";
    }

    let result = undefined;
    const localized = getValueByPath(locale, path);
    if (localized !== undefined) {
      result = localized;
    } else {
      const defaultValue = getValueByPath(LOCALES[DEFAULT_LANGUAGE], path);
      if (defaultValue !== undefined) {
        result = defaultValue;
      } else {
        result = actualFallback || path;
      }
    }

    if (actualValues && typeof result === "string") {
      Object.keys(actualValues).forEach((key) => {
        result = result.replace(new RegExp(`{${key}}`, "g"), String(actualValues[key]));
      });
    }

    return result;
  };

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useSiteLanguage() {
  return useContext(LanguageContext);
}
