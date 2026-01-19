import { cs } from "./locales/cs.js";
import { en } from "./locales/en.js";

const TRANSLATIONS = {
  cs,
  en,
};

const SUPPORTED_LOCALES = ["cs", "en"];

export const resolveLocale = () => {
  if (typeof localStorage !== "undefined") {
    const storedLocale = localStorage.getItem("tiled:locale");
    if (SUPPORTED_LOCALES.includes(storedLocale)) {
      return storedLocale;
    }
  }

  if (typeof navigator !== "undefined") {
    const browserLocale = navigator.language?.slice(0, 2).toLowerCase();
    if (SUPPORTED_LOCALES.includes(browserLocale)) {
      return browserLocale;
    }
  }

  return "en";
};

export const setLocale = (locale) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("tiled:locale", locale);
  }
};

export const getSupportedLocales = () => [...SUPPORTED_LOCALES];

export const t = (locale, key) => {
  const fallback = TRANSLATIONS.en?.[key];
  return TRANSLATIONS[locale]?.[key] ?? fallback ?? key;
};

export const getLanguageName = (locale) =>
  TRANSLATIONS[locale]?.languageName ?? locale;
