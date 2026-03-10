import bn from "@/src/i18n/locales/bn";
import en from "@/src/i18n/locales/en";

export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "bn"];

export const LOCALES = {
  en,
  bn,
};

export function getLocale(language) {
  return LOCALES[language] || LOCALES[DEFAULT_LANGUAGE];
}

export function getValueByPath(source, path) {
  if (!source || !path) {
    return undefined;
  }

  return String(path)
    .split(".")
    .reduce((acc, segment) => {
      if (acc == null) {
        return undefined;
      }
      return acc[segment];
    }, source);
}
