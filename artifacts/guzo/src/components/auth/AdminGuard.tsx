import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import type { ReactNode } from "react";

type Role = "moderator" | "admin" | "superadmin";

export function AdminGuard({
  children,
  minRole = "admin",
}: {
  children: ReactNode;
  /** Minimum role required (default: admin). Use "moderator" for staff-level pages or "superadmin" for top-tier. */
  minRole?: Role;
}) {
  const { t } = useTranslation();
  const { isLoading, hasRoleAtLeast } = useAuth();
  if (isLoading) return null;
  if (!hasRoleAtLeast(minRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h1 className="text-2xl font-serif font-bold text-primary mb-2">
          {t("admin.accessDenied")}
        </h1>
        <p className="text-muted-foreground mb-2">{t("admin.needPrivileges")}</p>
        <p className="text-xs text-muted-foreground mb-6 uppercase tracking-widest">
          {t("admin.minRole", { defaultValue: "Required" })}: {minRole}
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-full" data-testid="button-return-home">
            {t("admin.returnHome")}
          </Button>
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
