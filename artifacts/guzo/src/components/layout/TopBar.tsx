import { Link } from "wouter";
import { User, LogIn, Settings as SettingsIcon, Languages } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { SettingsSheet } from "./SettingsSheet";

export function TopBar() {
  const { t } = useTranslation();
  const { user, isAuthed, isAdmin, isLoading, openLogin } = useAuth();
  const { language, setLanguage } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
      <Link href="/">
        <div className="font-serif text-xl font-bold text-primary flex items-center gap-2 cursor-pointer" data-testid="link-home-logo">
          <span className="text-2xl leading-none">ጉዞ</span>
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground">
            {t("app.tagline")}
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setLanguage(language === "am" ? "en" : "am")}
          className="text-[11px] font-bold tracking-wider px-2.5 py-1.5 rounded-full bg-card border border-border/60 text-foreground hover-elevate active-elevate-2"
          data-testid="button-lang-toggle"
          aria-label="Toggle language"
        >
          <span className="flex items-center gap-1">
            <Languages className="h-3 w-3" />
            {language === "am" ? "EN" : "አማ"}
          </span>
        </button>

        {!isLoading && (
          isAuthed ? (
            <Link href={isAdmin ? "/admin" : "/"}>
              <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => openLogin()}
              data-testid="button-open-login-top"
              aria-label={t("auth.signIn")}
            >
              <LogIn className="h-5 w-5" />
            </Button>
          )
        )}

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setSettingsOpen(true)}
          data-testid="button-open-settings"
          aria-label={t("settings.title")}
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </div>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      {/* hide unused user var warning */}
      {user ? null : null}
    </header>
  );
}
