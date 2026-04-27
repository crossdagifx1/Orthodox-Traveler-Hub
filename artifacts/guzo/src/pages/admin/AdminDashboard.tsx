import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  LogOut,
  MapPin,
  Church,
  ShoppingBag,
  Music,
  FileText,
  ChevronRight,
  ShieldCheck,
  Users,
  ScrollText,
  Activity,
  Settings as SettingsIcon,
  Crown,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import {
  useAdminAnalyticsOverview,
  getAdminAnalyticsOverviewQueryKey,
} from "@workspace/api-client-react";

type Tile = {
  titleKey: string;
  descKey: string;
  icon: typeof MapPin;
  path: string;
  /** Minimum role that can see this tile. */
  minRole: "moderator" | "admin" | "superadmin";
  accentClass?: string;
};

const TILES: Tile[] = [
  // Content management — admins
  { titleKey: "nav.destinations", descKey: "admin.manageDestinations", icon: MapPin, path: "/admin/destinations", minRole: "admin" },
  { titleKey: "nav.map", descKey: "admin.manageChurches", icon: Church, path: "/admin/churches", minRole: "admin" },
  { titleKey: "nav.market", descKey: "admin.manageMarket", icon: ShoppingBag, path: "/admin/marketplace", minRole: "admin" },
  { titleKey: "nav.mezmurs", descKey: "admin.manageMezmurs", icon: Music, path: "/admin/mezmurs", minRole: "admin" },
  { titleKey: "nav.news", descKey: "admin.manageNews", icon: FileText, path: "/admin/news", minRole: "admin" },
  // Q&A — open to teachers (moderator+)
  { titleKey: "admin.qa.title", descKey: "admin.qa.subtitle", icon: GraduationCap, path: "/admin/qa", minRole: "moderator", accentClass: "border-primary/40" },
  // Operations
  { titleKey: "admin.users.title", descKey: "admin.users.subtitle", icon: Users, path: "/admin/users", minRole: "admin" },
  { titleKey: "admin.audit.title", descKey: "admin.audit.subtitle", icon: ScrollText, path: "/admin/audit", minRole: "admin" },
  { titleKey: "admin.analytics.title", descKey: "admin.analytics.subtitle", icon: Activity, path: "/admin/analytics", minRole: "admin" },
  // Super-admin only
  { titleKey: "admin.settings.title", descKey: "admin.settings.subtitle", icon: SettingsIcon, path: "/admin/settings", minRole: "superadmin", accentClass: "border-secondary/40" },
];

export function AdminDashboard() {
  const { t } = useTranslation();
  const { user, isLoading, isStaff, hasRoleAtLeast, isSuperAdmin, logout } = useAuth();
  const { data: stats } = useAdminAnalyticsOverview({
    query: { queryKey: getAdminAnalyticsOverviewQueryKey(), enabled: isStaff },
  });

  if (isLoading) return null;

  if (!isStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
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

  const visibleTiles = TILES.filter((tl) => hasRoleAtLeast(tl.minRole));

  return (
    <div className="p-4 pb-24 bg-background min-h-full pt-14">
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
      <div className="flex items-center gap-2 mb-6">
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <span
          className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1"
          data-testid="badge-my-role"
        >
          {isSuperAdmin && <Crown className="h-3 w-3" />}
          {user?.role}
        </span>
      </div>

      {/* At-a-glance stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-card rounded-2xl p-3 border border-border/60 shadow-sm text-center">
            <div className="text-2xl font-bold text-primary">{stats.users.total}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
              Users
            </div>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-border/60 shadow-sm text-center">
            <div className="text-2xl font-bold text-secondary">
              {stats.users.admins + stats.users.superadmins + stats.users.moderators}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
              Staff
            </div>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-border/60 shadow-sm text-center">
            <div className="text-2xl font-bold text-foreground">{stats.audit.last24h}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
              Audit 24h
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {visibleTiles.map((tl) => {
          const Icon = tl.icon;
          return (
            <Link key={tl.path} href={tl.path}>
              <div
                className={
                  "bg-card p-4 rounded-2xl border shadow-sm flex items-center gap-4 cursor-pointer hover-elevate transition-transform active:scale-[0.98] " +
                  (tl.accentClass ?? "border-border/50")
                }
                data-testid={`link-admin-${tl.path.replace("/admin/", "")}`}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">{t(tl.titleKey as any)}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t(tl.descKey as any)}</p>
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
