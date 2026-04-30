import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getListMyNotificationsQueryKey,
  useListMyNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function NotificationsBell() {
  const { t } = useTranslation();
  const { isAuthed } = useAuth();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const params = undefined;
  const { data } = useListMyNotifications(params, {
    query: {
      enabled: isAuthed,
      queryKey: getListMyNotificationsQueryKey(params),
      refetchInterval: POLL_MS,
      refetchOnWindowFocus: true,
    },
  });

  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (!isAuthed) return null;

  const items = Array.isArray(data?.items) ? data!.items : [];
  const unread = data?.unreadCount ?? 0;

  const invalidate = () =>
    qc.invalidateQueries({
      queryKey: getListMyNotificationsQueryKey(params),
    });

  const onItemClick = (id: string, link?: string) => {
    markOne.mutate({ id }, { onSuccess: invalidate });
    setOpen(false);
    if (link) navigate(link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("engagement.notifications", {
            defaultValue: "Notifications",
          })}
          data-testid="button-notifications"
          className={cn(
            "pointer-events-auto h-9 w-9 rounded-full flex items-center justify-center",
            "bg-background/80 backdrop-blur-md border border-border/60 shadow-md",
            "text-foreground hover-elevate active-elevate-2 relative",
          )}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              data-testid="badge-unread-count"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] p-0 max-h-[70vh] overflow-hidden flex flex-col"
      >
        <header className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <span className="text-sm font-bold">
            {t("engagement.notifications", { defaultValue: "Notifications" })}
          </span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs rounded-full"
              onClick={() =>
                markAll.mutate(undefined, { onSuccess: invalidate })
              }
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              {t("engagement.markAllRead", { defaultValue: "Mark all read" })}
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t("engagement.noNotifications", {
                defaultValue: "You're all caught up.",
              })}
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {items.map((n) => {
                const link = (n.link as string | undefined) || undefined;
                const Wrapper: React.ElementType = link ? "button" : "div";
                return (
                  <li key={n.id}>
                    <Wrapper
                      type={link ? "button" : undefined}
                      onClick={
                        link ? () => onItemClick(n.id, link) : undefined
                      }
                      className={cn(
                        "w-full text-left px-3 py-2 flex gap-3 items-start",
                        link && "hover-elevate cursor-pointer",
                        !n.isRead && "bg-primary/5",
                      )}
                      data-testid={`notif-${n.id}`}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 rounded-full shrink-0",
                          n.isRead ? "bg-transparent" : "bg-primary",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold leading-tight truncate">
                          {n.title}
                        </div>
                        {n.body && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.body}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {timeAgo(n.createdAt)}
                        </div>
                      </div>
                    </Wrapper>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="border-t border-border/60 px-3 py-2">
          <Link
            href="/me"
            onClick={() => setOpen(false)}
            className="text-xs text-primary hover:underline"
            data-testid="link-view-profile-from-notifs"
          >
            {t("engagement.viewProfile", { defaultValue: "View profile" })}
          </Link>
        </footer>
      </PopoverContent>
    </Popover>
  );
}
