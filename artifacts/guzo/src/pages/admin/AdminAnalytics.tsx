import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import {
  ChevronLeft,
  Users,
  ShieldCheck,
  Crown,
  Shield,
  Ban,
  UserX,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  useAdminAnalyticsOverview,
  getAdminAnalyticsOverviewQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function AdminAnalytics() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminAnalyticsOverview({
    query: { queryKey: getAdminAnalyticsOverviewQueryKey() },
  });

  const stats = data ?? {
    users: {
      total: 0,
      active: 0,
      suspended: 0,
      banned: 0,
      admins: 0,
      superadmins: 0,
      moderators: 0,
      recent: 0,
    },
    content: { destinations: 0, churches: 0, marketplaceItems: 0, mezmurs: 0, newsPosts: 0 },
    audit: { total: 0, last24h: 0 },
  };

  const userTiles = [
    { label: "Total", value: stats.users.total, icon: Users, accent: "text-primary" },
    { label: "Active", value: stats.users.active, icon: ShieldCheck, accent: "text-emerald-600" },
    { label: "Suspended", value: stats.users.suspended, icon: UserX, accent: "text-amber-600" },
    { label: "Banned", value: stats.users.banned, icon: Ban, accent: "text-rose-600" },
    { label: "Super-admins", value: stats.users.superadmins, icon: Crown, accent: "text-secondary" },
    { label: "Admins", value: stats.users.admins, icon: ShieldCheck, accent: "text-primary" },
    { label: "Moderators", value: stats.users.moderators, icon: Shield, accent: "text-blue-600" },
    { label: "New (7d)", value: stats.users.recent, icon: TrendingUp, accent: "text-primary" },
  ];

  const contentTiles = [
    { label: "Destinations", value: stats.content.destinations },
    { label: "Churches", value: stats.content.churches },
    { label: "Market items", value: stats.content.marketplaceItems },
    { label: "Mezmurs", value: stats.content.mezmurs },
    { label: "News posts", value: stats.content.newsPosts },
  ];

  return (
    <div className="p-4 pb-24 bg-background min-h-full">
      <div className="flex items-center justify-between mb-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="rounded-full -ml-2 gap-1" data-testid="link-back-admin">
            <ChevronLeft className="h-4 w-4" /> {t("nav.admin")}
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        {t("admin.analytics.title", { defaultValue: "Analytics" })}
      </h1>

      {isLoading && <div className="text-center text-muted-foreground py-8 text-sm">Loading…</div>}

      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
          {t("admin.analytics.users", { defaultValue: "Users" })}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {userTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.label}
                className="bg-card border border-border/60 rounded-2xl p-3 shadow-sm"
                data-testid={`stat-${tile.label.toLowerCase().replace(/\W/g, "-")}`}
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-widest font-bold">{tile.label}</span>
                  <Icon className={`h-3.5 w-3.5 ${tile.accent}`} />
                </div>
                <div className={`text-2xl font-bold mt-1 ${tile.accent}`}>{tile.value}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
          {t("admin.analytics.content", { defaultValue: "Content" })}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {contentTiles.map((tile) => (
            <div
              key={tile.label}
              className="bg-card border border-border/60 rounded-2xl p-3 shadow-sm"
              data-testid={`stat-content-${tile.label.toLowerCase().replace(/\W/g, "-")}`}
            >
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {tile.label}
              </div>
              <div className="text-2xl font-bold text-primary mt-1">{tile.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
          {t("admin.analytics.audit", { defaultValue: "Audit" })}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-border/60 rounded-2xl p-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              All time
            </div>
            <div className="text-2xl font-bold text-secondary mt-1">{stats.audit.total}</div>
          </div>
          <div
            className="bg-card border border-border/60 rounded-2xl p-3 shadow-sm"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), transparent)" }}
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              Last 24h
            </div>
            <div className="text-2xl font-bold text-primary mt-1">{stats.audit.last24h}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
