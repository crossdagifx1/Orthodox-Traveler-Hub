import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import type { ReactNode } from "react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { isLoading, isAdmin } = useAuth();
  if (isLoading) return null;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <h1 className="text-2xl font-serif font-bold text-primary mb-2">
          {t("admin.accessDenied")}
        </h1>
        <p className="text-muted-foreground mb-6">{t("admin.needPrivileges")}</p>
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
