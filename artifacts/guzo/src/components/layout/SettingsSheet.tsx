import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Languages, Sun, Moon, Monitor, Calendar, Type, LogOut } from "lucide-react";
import { useSettings } from "@/providers/SettingsProvider";
import { useAuth } from "@/providers/AuthProvider";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

export function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const settings = useSettings();
  const { user, isAuthed, logout, openLogin } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[88vw] sm:w-[400px] overflow-y-auto"
        data-testid="sheet-settings"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl text-primary">{t("settings.title")}</SheetTitle>
          <SheetDescription>{t("settings.about")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-7">
          <section>
            <SectionTitle icon={<Languages className="h-4 w-4" />} label={t("settings.language")} />
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.map((l) => (
                <Pill
                  key={l.code}
                  active={settings.language === l.code}
                  onClick={() => settings.setLanguage(l.code)}
                  testId={`button-lang-${l.code}`}
                >
                  <span className="block font-serif text-base">{l.label}</span>
                  <span className="block text-[10px] uppercase tracking-widest opacity-70">
                    {l.english}
                  </span>
                </Pill>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle icon={<Sun className="h-4 w-4" />} label={t("settings.theme")} />
            <div className="grid grid-cols-3 gap-2">
              <Pill
                active={settings.theme === "light"}
                onClick={() => settings.setTheme("light")}
                testId="button-theme-light"
              >
                <Sun className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">{t("settings.themeLight")}</span>
              </Pill>
              <Pill
                active={settings.theme === "dark"}
                onClick={() => settings.setTheme("dark")}
                testId="button-theme-dark"
              >
                <Moon className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">{t("settings.themeDark")}</span>
              </Pill>
              <Pill
                active={settings.theme === "auto"}
                onClick={() => settings.setTheme("auto")}
                testId="button-theme-auto"
              >
                <Monitor className="h-4 w-4 mx-auto mb-1" />
                <span className="text-xs">{t("settings.themeAuto")}</span>
              </Pill>
            </div>
          </section>

          <section>
            <SectionTitle icon={<Type className="h-4 w-4" />} label={t("settings.fontSize")} />
            <div className="grid grid-cols-3 gap-2">
              <Pill
                active={settings.fontSize === "sm"}
                onClick={() => settings.setFontSize("sm")}
                testId="button-font-sm"
              >
                <span className="text-xs">{t("settings.fontSizeSmall")}</span>
              </Pill>
              <Pill
                active={settings.fontSize === "md"}
                onClick={() => settings.setFontSize("md")}
                testId="button-font-md"
              >
                <span className="text-sm">{t("settings.fontSizeMedium")}</span>
              </Pill>
              <Pill
                active={settings.fontSize === "lg"}
                onClick={() => settings.setFontSize("lg")}
                testId="button-font-lg"
              >
                <span className="text-base">{t("settings.fontSizeLarge")}</span>
              </Pill>
            </div>
          </section>

          <section>
            <SectionTitle icon={<Calendar className="h-4 w-4" />} label={t("settings.calendar")} />
            <div className="grid grid-cols-2 gap-2">
              <Pill
                active={settings.calendar === "ethiopian"}
                onClick={() => settings.setCalendar("ethiopian")}
                testId="button-cal-ethiopian"
              >
                <span className="text-xs">{t("settings.calendarEthiopian")}</span>
              </Pill>
              <Pill
                active={settings.calendar === "gregorian"}
                onClick={() => settings.setCalendar("gregorian")}
                testId="button-cal-gregorian"
              >
                <span className="text-xs">{t("settings.calendarGregorian")}</span>
              </Pill>
            </div>
          </section>

          <section className="pt-4 border-t border-border/60">
            {isAuthed ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-muted-foreground text-xs">{user?.email}</div>
                </div>
                <Button
                  onClick={() => {
                    logout();
                    onOpenChange(false);
                  }}
                  variant="outline"
                  className="w-full rounded-full"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("auth.logout")}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  openLogin();
                }}
                className="w-full rounded-full"
                data-testid="button-open-login"
              >
                {t("auth.signIn")}
              </Button>
            )}
            <p className="text-[10px] text-muted-foreground text-center mt-4">
              {t("settings.version")}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "rounded-xl border px-3 py-3 text-center transition-all hover-elevate active-elevate-2",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
