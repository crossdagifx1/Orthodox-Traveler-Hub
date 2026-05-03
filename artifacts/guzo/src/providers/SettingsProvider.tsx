import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { LangCode } from "@/i18n";

type Theme = "light" | "dark" | "auto";
type FontSize = "sm" | "md" | "lg";
type CalendarMode = "ethiopian" | "gregorian";
type ViewMode = "auto" | "phone" | "desktop";

type SettingsState = {
  language: LangCode;
  theme: Theme;
  fontSize: FontSize;
  calendar: CalendarMode;
  viewMode: ViewMode;
  /** Effective view ("phone" | "desktop") after resolving "auto". */
  effectiveView: "phone" | "desktop";
  setLanguage: (l: LangCode) => void;
  setTheme: (t: Theme) => void;
  setFontSize: (s: FontSize) => void;
  setCalendar: (c: CalendarMode) => void;
  setViewMode: (v: ViewMode) => void;
  isAmharic: boolean;
};

const SettingsContext = createContext<SettingsState | null>(null);
const LS_THEME = "guzo-theme";
const LS_FONT = "guzo-font";
const LS_CAL = "guzo-cal";
const LS_VIEW = "guzo-view";

/** Width above which "auto" resolves to desktop. */
const DESKTOP_BREAKPOINT_PX = 1024;

function readLs<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  return (v as T) || fallback;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  // Check URL params for session override
  const urlParams = new URLSearchParams(window.location.search);
  const urlTheme = urlParams.get('theme');
  
  const wantDark =
    theme === "dark" ||
    (theme === "auto" && (
      urlTheme === 'dark' || 
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ));
    
  root.classList.toggle("dark", wantDark);
}

function applyFontSize(s: FontSize) {
  const root = document.documentElement;
  root.dataset.fontSize = s;
  const px = s === "sm" ? "15px" : s === "lg" ? "18px" : "16px";
  root.style.fontSize = px;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<LangCode>(
    () => (i18n.language?.split("-")[0] as LangCode) || "am",
  );
  const [theme, setThemeState] = useState<Theme>(() => readLs<Theme>(LS_THEME, "auto"));
  const [fontSize, setFontSizeState] = useState<FontSize>(
    () => readLs<FontSize>(LS_FONT, "md"),
  );
  const [calendar, setCalendarState] = useState<CalendarMode>(
    () => readLs<CalendarMode>(LS_CAL, "ethiopian"),
  );
  const [viewMode, setViewModeState] = useState<ViewMode>(
    () => readLs<ViewMode>(LS_VIEW, "auto"),
  );
  const [autoIsDesktop, setAutoIsDesktop] = useState<boolean>(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`).matches,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`);
    const onChange = () => setAutoIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const effectiveView: "phone" | "desktop" =
    viewMode === "auto" ? (autoIsDesktop ? "desktop" : "phone") : viewMode;

  useEffect(() => {
    document.documentElement.dataset.view = effectiveView;
  }, [effectiveView]);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("auto");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.lang = language;
  }, [language]);

  const value = useMemo<SettingsState>(
    () => ({
      language,
      theme,
      fontSize,
      calendar,
      isAmharic: language === "am",
      setLanguage: (l) => {
        setLanguageState(l);
        void i18n.changeLanguage(l);
      },
      setTheme: (t) => {
        setThemeState(t);
        window.localStorage.setItem(LS_THEME, t);
      },
      setFontSize: (s) => {
        setFontSizeState(s);
        window.localStorage.setItem(LS_FONT, s);
      },
      setCalendar: (c) => {
        setCalendarState(c);
        window.localStorage.setItem(LS_CAL, c);
      },
      setViewMode: (v) => {
        setViewModeState(v);
        window.localStorage.setItem(LS_VIEW, v);
      },
      viewMode,
      effectiveView,
    }),
    [language, theme, fontSize, calendar, viewMode, effectiveView, i18n],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
