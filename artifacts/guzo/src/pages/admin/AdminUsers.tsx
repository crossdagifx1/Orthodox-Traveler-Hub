import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ChevronLeft,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Ban,
  Trash2,
  Crown,
  User as UserIcon,
} from "lucide-react";
import {
  useAdminListUsers,
  getAdminListUsersQueryKey,
  useAdminUpdateUser,
  useAdminDeleteUser,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ROLES = ["user", "moderator", "admin", "superadmin"] as const;
const STATUSES = ["active", "suspended", "banned"] as const;

const ROLE_STYLE: Record<string, string> = {
  user: "bg-muted text-muted-foreground",
  moderator: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  admin: "bg-primary/15 text-primary",
  superadmin: "bg-secondary text-secondary-foreground",
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  suspended: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  banned: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
};

const ROLE_ICON: Record<string, typeof Shield> = {
  user: UserIcon,
  moderator: Shield,
  admin: ShieldCheck,
  superadmin: Crown,
};

export function AdminUsers() {
  const { t } = useTranslation();
  const { isSuperAdmin, user: me } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const params = {
    q: q || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };
  const queryKey = getAdminListUsersQueryKey(params);
  const { data: users, isLoading } = useAdminListUsers(params, { query: { queryKey } });

  const update = useAdminUpdateUser();
  const del = useAdminDeleteUser();

  const refetch = () =>
    qc.invalidateQueries({
      // The generated query key is the URL path + params; matching by the
      // path prefix invalidates every variant of the user list.
      predicate: (q) => Array.isArray(q.queryKey) && String(q.queryKey[0]).includes("/admin/users"),
    });

  const onChangeRole = (id: string, role: string) => {
    update.mutate(
      { id, data: { role: role as any } },
      {
        onSuccess: () => {
          toast({ title: t("admin.users.roleUpdated", { defaultValue: "Role updated" }) });
          refetch();
        },
        onError: (e: any) => {
          toast({
            title: e?.response?.data?.error || "Failed",
            variant: "destructive",
          });
        },
      },
    );
  };

  const onChangeStatus = (id: string, status: string) => {
    update.mutate(
      { id, data: { status: status as any } },
      {
        onSuccess: () => {
          toast({ title: t("admin.users.statusUpdated", { defaultValue: "Status updated" }) });
          refetch();
        },
        onError: (e: any) => {
          toast({
            title: e?.response?.data?.error || "Failed",
            variant: "destructive",
          });
        },
      },
    );
  };

  const onDelete = (id: string, email: string) => {
    if (!window.confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    del.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: t("admin.users.deleted", { defaultValue: "User deleted" }) });
          refetch();
        },
        onError: (e: any) => {
          toast({
            title: e?.response?.data?.error || "Failed",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="p-4 pb-24 bg-background min-h-full">
      <div className="flex items-center justify-between mb-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="rounded-full -ml-2 gap-1" data-testid="link-back-admin">
            <ChevronLeft className="h-4 w-4" /> {t("nav.admin")}
          </Button>
        </Link>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {users?.length ?? 0} {t("admin.users.total", { defaultValue: "users" })}
        </div>
      </div>

      <h1 className="text-2xl font-serif font-bold text-foreground mb-1 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        {t("admin.users.title", { defaultValue: "User Management" })}
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        {t("admin.users.subtitle", {
          defaultValue: "Suspend, ban, or change roles. Super-admin actions are audited.",
        })}
      </p>

      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search email or name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 rounded-full h-9 text-sm"
            data-testid="input-search-users"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 rounded-full text-xs flex-1" data-testid="select-role-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 rounded-full text-xs flex-1" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <div className="text-center text-muted-foreground py-8 text-sm">Loading…</div>}

      <ul className="space-y-2">
        {(Array.isArray(users) ? users : []).map((u) => {
          const RoleIcon = ROLE_ICON[u.role] ?? UserIcon;
          const isMe = me?.id === u.id;
          return (
            <li
              key={u.id}
              className="bg-card rounded-2xl border border-border/60 p-3 shadow-sm"
              data-testid={`user-row-${u.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <RoleIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">
                      {u.name}
                      {isMe && (
                        <span className="ml-1 text-[10px] uppercase tracking-widest text-primary">
                          (you)
                        </span>
                      )}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wide font-bold",
                        ROLE_STYLE[u.role],
                      )}
                      data-testid={`badge-role-${u.id}`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wide font-bold",
                        STATUS_STYLE[u.status],
                      )}
                      data-testid={`badge-status-${u.id}`}
                    >
                      {u.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  {u.notes && (
                    <div className="mt-1 text-[11px] text-muted-foreground italic line-clamp-2">
                      “{u.notes}”
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Select
                      value={u.role}
                      onValueChange={(v) => onChangeRole(u.id, v)}
                      disabled={isMe || (!isSuperAdmin && (u.role === "admin" || u.role === "superadmin"))}
                    >
                      <SelectTrigger
                        className="h-8 text-xs rounded-full"
                        data-testid={`select-role-${u.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} disabled={!isSuperAdmin && (r === "admin" || r === "superadmin")}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={u.status}
                      onValueChange={(v) => onChangeStatus(u.id, v)}
                      disabled={isMe}
                    >
                      <SelectTrigger
                        className="h-8 text-xs rounded-full"
                        data-testid={`select-status-${u.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {u.status !== "suspended" && !isMe && (
                      <button
                        type="button"
                        onClick={() => onChangeStatus(u.id, "suspended")}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-amber-300 text-amber-700 dark:text-amber-300 hover-elevate active-elevate-2"
                        data-testid={`button-suspend-${u.id}`}
                      >
                        <UserX className="h-3 w-3 inline mr-1" />
                        Suspend
                      </button>
                    )}
                    {u.status !== "active" && !isMe && (
                      <button
                        type="button"
                        onClick={() => onChangeStatus(u.id, "active")}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-emerald-300 text-emerald-700 dark:text-emerald-300 hover-elevate active-elevate-2"
                        data-testid={`button-reactivate-${u.id}`}
                      >
                        <UserCheck className="h-3 w-3 inline mr-1" />
                        Reactivate
                      </button>
                    )}
                    {u.status !== "banned" && !isMe && (
                      <button
                        type="button"
                        onClick={() => onChangeStatus(u.id, "banned")}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-rose-300 text-rose-700 dark:text-rose-300 hover-elevate active-elevate-2"
                        data-testid={`button-ban-${u.id}`}
                      >
                        <Ban className="h-3 w-3 inline mr-1" />
                        Ban
                      </button>
                    )}
                    {isSuperAdmin && !isMe && (
                      <button
                        type="button"
                        onClick={() => onDelete(u.id, u.email)}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-destructive/40 text-destructive hover-elevate active-elevate-2"
                        data-testid={`button-delete-${u.id}`}
                      >
                        <Trash2 className="h-3 w-3 inline mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {!isLoading && (users?.length ?? 0) === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldAlert className="h-10 w-10 mx-auto opacity-30 mb-3" />
          <p>{t("admin.users.empty", { defaultValue: "No users match the filters." })}</p>
        </div>
      )}
    </div>
  );
}
