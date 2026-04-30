import { useState } from "react";
import { Link } from "wouter";
import { Menu, Languages, Settings as SettingsIcon, User, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/providers/AuthProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { SettingsSheet } from "./SettingsSheet";
import { MainNavSheet } from "./MainNavSheet";
import { StreakChip } from "@/components/engagement/StreakChip";
import { NotificationsBell } from "@/components/engagement/NotificationsBell";

/**
 * Top-bar replacement: chrome-less floating action buttons.
 * - Top-left: hamburger menu (opens MainNavSheet)
 * - Top-right: language toggle + auth icon + settings
 *
 * No fixed header so the app remains embeddable in another web/native shell.
 * Buttons sit above page content as floating glass pills with safe-area padding.
 */
export function FloatingControls() {
  const { t } = useTranslation();
  const { isAuthed, isAdmin, isLoading, openLogin } = useAuth();
  const { language, setLanguage } = useSettings();
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      {/* Left cluster: menu */}
      <div
        className="fixed md:absolute left-2 top-2 z-50 pointer-events-none"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label={t("nav.menu", { defaultValue: "Menu" })}
          data-testid="button-open-main-nav"
          className="pointer-events-auto h-10 w-10 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-md border border-border/60 shadow-md text-foreground hover-elevate active-elevate-2"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right cluster: language + user + settings */}
      <div
        className="fixed md:absolute right-2 top-2 z-50 pointer-events-none flex items-center gap-1.5"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button
          type="button"
          onClick={() => setLanguage(language === "am" ? "en" : "am")}
          aria-label="Toggle language"
          data-testid="button-lang-toggle"
          className="pointer-events-auto h-9 px-3 rounded-full flex items-center gap-1 text-[11px] font-bold tracking-wider bg-background/80 backdrop-blur-md border border-border/60 shadow-md text-foreground hover-elevate active-elevate-2"
        >
          <Languages className="h-3.5 w-3.5" />
          {language === "am" ? "EN" : "አማ"}
        </button>

        {!isLoading && isAuthed && (
          <>
            <StreakChip />
            <NotificationsBell />
          </>
        )}

        {!isLoading &&
          (isAuthed ? (
            <Link
              href={isAdmin ? "/admin" : "/me"}
              data-testid="button-user"
              aria-label={t("profile.title", { defaultValue: "Profile" })}
              className="pointer-events-auto h-9 w-9 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-md border border-border/60 shadow-md text-foreground hover-elevate active-elevate-2 no-underline"
            >
              <User className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openLogin()}
              aria-label={t("auth.signIn")}
              data-testid="button-open-login-top"
              className="pointer-events-auto h-9 w-9 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-md border border-border/60 shadow-md text-foreground hover-elevate active-elevate-2"
            >
              <LogIn className="h-4 w-4" />
            </button>
          ))}

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={t("settings.title")}
          data-testid="button-open-settings"
          className="pointer-events-auto h-9 w-9 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-md border border-border/60 shadow-md text-foreground hover-elevate active-elevate-2"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <MainNavSheet
        open={navOpen}
        onOpenChange={setNavOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    </>
  );
}
