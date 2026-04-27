import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { ChevronLeft, ScrollText, User, Activity, Calendar } from "lucide-react";
import { useAdminListAudit, getAdminListAuditQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ACTION_TYPES = [
  "all",
  "user.update",
  "user.delete",
  "system.settings.update",
];

export function AdminAudit() {
  const { t } = useTranslation();
  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const params = {
    actorId: actorFilter && /^\d+$/.test(actorFilter) ? Number(actorFilter) : undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
  };
  const queryKey = getAdminListAuditQueryKey(params);
  const { data: entries, isLoading } = useAdminListAudit(params, { query: { queryKey } });

  return (
    <div className="p-4 pb-24 bg-background min-h-full">
      <div className="flex items-center justify-between mb-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="rounded-full -ml-2 gap-1" data-testid="link-back-admin">
            <ChevronLeft className="h-4 w-4" /> {t("nav.admin")}
          </Button>
        </Link>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {entries?.length ?? 0} {t("admin.audit.entries", { defaultValue: "entries" })}
        </div>
      </div>

      <h1 className="text-2xl font-serif font-bold text-foreground mb-1 flex items-center gap-2">
        <ScrollText className="h-6 w-6 text-primary" />
        {t("admin.audit.title", { defaultValue: "Audit Log" })}
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        {t("admin.audit.subtitle", {
          defaultValue: "Append-only record of every privileged action.",
        })}
      </p>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Actor ID"
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="h-9 rounded-full text-sm flex-1"
          data-testid="input-actor-filter"
        />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="h-9 rounded-full text-xs w-[180px]" data-testid="select-action-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((a) => (
              <SelectItem key={a} value={a}>
                {a === "all" ? "All actions" : a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className="text-center text-muted-foreground py-8 text-sm">Loading…</div>}

      <ul className="space-y-2">
        {(entries ?? []).map((e) => (
          <li
            key={e.id}
            className="bg-card rounded-xl border border-border/60 p-3 shadow-sm"
            data-testid={`audit-row-${e.id}`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(e.createdAt).toLocaleString()}
              <span className="text-[10px] uppercase tracking-widest font-bold ml-auto px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {e.actorRole}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              {e.actorEmail}
              <span className="text-muted-foreground font-normal text-xs">
                {e.ip ? `· ${e.ip}` : ""}
              </span>
            </div>
            <div className="mt-1 text-xs flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-secondary" />
              <span className="font-mono font-bold text-secondary">{e.action}</span>
              <span className="text-muted-foreground">on</span>
              <span className="font-mono">
                {e.targetType}
                {e.targetId ? `#${e.targetId}` : ""}
              </span>
            </div>
            {e.metadata && Object.keys(e.metadata as object).length > 0 && (
              <pre className="mt-2 text-[10px] bg-muted/40 p-2 rounded-lg overflow-x-auto text-muted-foreground">
                {JSON.stringify(e.metadata, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>

      {!isLoading && (entries?.length ?? 0) === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ScrollText className="h-10 w-10 mx-auto opacity-30 mb-3" />
          <p>{t("admin.audit.empty", { defaultValue: "No audit entries yet." })}</p>
        </div>
      )}
    </div>
  );
}
