import { Link } from "wouter";
import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getGetMyStreakQueryKey,
  useGetMyStreak,
} from "@workspace/api-client-react";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

/**
 * Compact streak chip shown in the floating top-bar when the user is signed
 * in. Tapping it deep-links to /me. Hidden for anonymous users and when the
 * streak is zero (avoids dead UI noise).
 */
export function StreakChip() {
  const { t } = useTranslation();
  const { isAuthed } = useAuth();
  const { data } = useGetMyStreak({
    query: { enabled: isAuthed, queryKey: getGetMyStreakQueryKey() },
  });

  if (!isAuthed) return null;
  const streak = data?.currentStreak ?? 0;
  if (streak <= 0) return null;

  return (
    <Link
      href="/me"
      data-testid="chip-streak"
      aria-label={t("engagement.streakAria", {
        defaultValue: "{{count}}-day streak",
        count: streak,
      })}
      className={cn(
        "pointer-events-auto h-9 px-3 rounded-full flex items-center gap-1",
        "text-[11px] font-bold tracking-wider no-underline",
        "bg-background/80 backdrop-blur-md border border-border/60 shadow-md",
        "text-orange-500 hover-elevate active-elevate-2",
      )}
    >
      <Flame className="h-3.5 w-3.5 fill-current" />
      {streak}
    </Link>
  );
}
