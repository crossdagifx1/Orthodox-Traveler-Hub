import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import am from "./locales/am.json";
import en from "./locales/en.json";

export const SUPPORTED_LANGUAGES = [
  { code: "am", label: "አማርኛ", english: "Amharic" },
  { code: "en", label: "English", english: "English" },
] as const;

export type LangCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const LS_KEY = "guzo-lang-v2";

function readInitialLanguage(): LangCode {
  if (typeof window === "undefined") return "am";
  const stored = window.localStorage.getItem(LS_KEY);
  if (stored === "am" || stored === "en") return stored;
  return "am";
}

void i18n.use(initReactI18next).init({
  resources: {
    am: { translation: am },
    en: { translation: en },
  },
  lng: readInitialLanguage(),
  fallbackLng: "am",
  supportedLngs: ["am", "en"],
  interpolation: { escapeValue: false },
});

if (typeof window !== "undefined") {
  i18n.on("languageChanged", (lng) => {
    if (lng === "am" || lng === "en") {
      window.localStorage.setItem(LS_KEY, lng);
    }
  });
}

export default i18n;
