import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Home,
  MapPin,
  Map as MapIcon,
  ShoppingBag,
  Music,
  Newspaper,
  GraduationCap,
  Trophy,
  Shield,
  LogIn,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  ChevronRight,
  Cross,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

type NavItem = {
  path: string;
  icon: typeof Home;
  key: string;
  testId: string;
};

const PRIMARY: NavItem[] = [
  { path: "/", icon: Home, key: "home", testId: "nav-home" },
  { path: "/destinations", icon: MapPin, key: "destinations", testId: "nav-destinations" },
  { path: "/learn", icon: GraduationCap, key: "learn", testId: "nav-learn" },
  { path: "/learn/leaderboard", icon: Trophy, key: "leaderboard", testId: "nav-leaderboard" },
  { path: "/map", icon: MapIcon, key: "map", testId: "nav-map" },
  { path: "/marketplace", icon: ShoppingBag, key: "market", testId: "nav-market" },
  { path: "/mezmurs", icon: Music, key: "mezmurs", testId: "nav-mezmurs" },
  { path: "/news", icon: Newspaper, key: "news", testId: "nav-news" },
];

export function MainNavSheet({
  open,
  onOpenChange,
  onOpenSettings,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOpenSettings: () => void;
}) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user, isAuthed, isAdmin, openLogin, logout } = useAuth();

  const close = () => onOpenChange(false);

  const isActive = (path: string) =>
    location === path || (path !== "/" && location.startsWith(path));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[86vw] sm:w-[380px] overflow-y-auto p-0 bg-background"
        data-testid="sheet-main-nav"
      >
        {/* Gold ribbon header */}
        <div
          className="px-6 pt-7 pb-6 text-primary-foreground relative overflow-hidden"
          style={{ background: "var(--gold-gradient)" }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-black/10 blur-2xl" />
          <SheetHeader className="text-left relative z-10 space-y-1">
            <SheetTitle className="font-serif text-3xl text-primary-foreground flex items-center gap-2">
              <span>ጉዞ</span>
              <Cross className="h-5 w-5 opacity-80" strokeWidth={2.5} />
            </SheetTitle>
            <SheetDescription className="text-primary-foreground/85 text-sm">
              {t("app.tagline")}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 relative z-10">
            {isAuthed && user ? (
              <div className="flex items-center gap-3 bg-black/15 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{user.name || user.email}</div>
                  <div className="text-[11px] opacity-80 truncate">{user.email}</div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => {
                  close();
                  openLogin();
                }}
                className="w-full h-11 rounded-full bg-white/20 hover:bg-white/30 text-primary-foreground border border-white/25 backdrop-blur-sm"
                data-testid="button-nav-login"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t("auth.signIn")}
              </Button>
            )}
          </div>
        </div>

        {/* Primary nav */}
        <nav className="px-3 pt-4 pb-2">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
            {t("nav.menu", { defaultValue: "Menu" })}
          </div>
          <ul className="space-y-0.5">
            {PRIMARY.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={close}
                    data-testid={item.testId}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all hover-elevate active-elevate-2 no-underline",
                      active
                        ? "bg-primary/10 text-primary border border-primary/15"
                        : "text-foreground border border-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
                    </span>
                    <span className={cn("flex-1 font-medium", active && "font-semibold")}>
                      {t(`nav.${item.key}`)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Secondary actions */}
        <div className="px-3 pt-2 pb-6">
          <div className="px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
            {t("nav.account", { defaultValue: "Account" })}
          </div>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => {
                  close();
                  onOpenSettings();
                }}
                data-testid="button-nav-open-settings"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover-elevate active-elevate-2"
              >
                <span className="h-9 w-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                  <SettingsIcon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex-1 font-medium">{t("settings.title")}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
              </button>
            </li>

            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  onClick={close}
                  data-testid="nav-admin"
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover-elevate active-elevate-2 border border-secondary/30 bg-secondary/5 no-underline"
                >
                  <span className="h-9 w-9 rounded-lg flex items-center justify-center bg-secondary text-secondary-foreground">
                    <Shield className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1 font-semibold text-secondary">{t("nav.admin")}</span>
                  <ChevronRight className="h-4 w-4 text-secondary/60" />
                </Link>
              </li>
            )}

            {isAuthed && (
              <li>
                <button
                  onClick={() => {
                    close();
                    void logout();
                  }}
                  data-testid="button-nav-logout"
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover-elevate active-elevate-2 text-destructive"
                >
                  <span className="h-9 w-9 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive">
                    <LogOut className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1 font-medium">{t("auth.logout")}</span>
                </button>
              </li>
            )}
          </ul>

          <div className="mt-6 px-3">
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                {t("app.name")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t("settings.version")}</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
