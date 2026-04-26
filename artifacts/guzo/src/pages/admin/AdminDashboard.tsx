import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LogOut, MapPin, Church, ShoppingBag, Music, FileText, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";

export function AdminDashboard() {
  const { t } = useTranslation();
  const { user, isLoading, isAdmin, logout } = useAuth();

  if (isLoading) return null;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <h1 className="text-2xl font-serif font-bold text-primary mb-2">
          {t("admin.accessDenied")}
        </h1>
        <p className="text-muted-foreground mb-6">{t("admin.needPrivileges")}</p>
        <Link href="/">
          <Button variant="outline" className="rounded-full">
            {t("admin.returnHome")}
          </Button>
        </Link>
      </div>
    );
  }

  const sections = [
    { titleKey: "nav.destinations" as const, descKey: "admin.manageDestinations" as const, icon: MapPin, path: "/admin/destinations" },
    { titleKey: "nav.map" as const, descKey: "admin.manageChurches" as const, icon: Church, path: "/admin/churches" },
    { titleKey: "nav.market" as const, descKey: "admin.manageMarket" as const, icon: ShoppingBag, path: "/admin/marketplace" },
    { titleKey: "nav.mezmurs" as const, descKey: "admin.manageMezmurs" as const, icon: Music, path: "/admin/mezmurs" },
    { titleKey: "nav.news" as const, descKey: "admin.manageNews" as const, icon: FileText, path: "/admin/news" },
  ];

  return (
    <div className="p-4 pb-24 bg-background min-h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs uppercase tracking-widest font-semibold">
            {t("admin.console")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="rounded-full text-destructive"
          data-testid="button-admin-logout"
          aria-label={t("auth.logout")}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
      <h1 className="text-2xl font-serif font-bold text-foreground mb-1">
        {t("admin.welcome", { name: user?.name || user?.email })}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{user?.email}</p>

      <div className="grid gap-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.path} href={s.path}>
              <div
                className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4 cursor-pointer hover-elevate transition-transform active:scale-[0.98]"
                data-testid={`link-admin-${s.path.replace("/admin/", "")}`}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-lg">{t(s.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground truncate">{t(s.descKey)}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
