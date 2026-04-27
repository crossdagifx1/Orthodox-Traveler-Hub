import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trophy, Crown, Target } from "lucide-react";
import {
  useQaLeaderboard,
  getQaLeaderboardQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const WINDOWS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
] as const;

type WinKey = (typeof WINDOWS)[number]["key"];

export function Leaderboard() {
  const { t } = useTranslation();
  const [win, setWin] = useState<WinKey>("week");
  const { user } = useAuth();
  const params = { window: win, limit: 100 };
  const { data, isLoading } = useQaLeaderboard(params, {
    query: { queryKey: getQaLeaderboardQueryKey(params) },
  });

  return (
    <div className="pb-24">
      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40">
        <div className="flex items-center justify-between mb-3">
          <Link href="/learn">
            <Button variant="ghost" size="sm" className="rounded-full" data-testid="button-back-learn">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
            </Button>
          </Link>
          <div className="flex items-center gap-1.5 text-primary">
            <Trophy className="h-4 w-4" />
            <span className="text-xs uppercase tracking-widest font-bold">{t("learn.leaderboard")}</span>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setWin(w.key)}
              data-testid={`tab-window-${w.key}`}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border",
                win === w.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground",
              )}
            >
              {t(`learn.window.${w.key}` as any, { defaultValue: w.label })}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Top 3 podium */}
        {data && data.entries.length >= 3 ? (
          <div className="grid grid-cols-3 gap-2 mb-5 items-end">
            <Podium entry={data.entries[1]} place={2} />
            <Podium entry={data.entries[0]} place={1} />
            <Podium entry={data.entries[2]} place={3} />
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !data || data.entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Trophy className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t("learn.lbEmpty")}</p>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {data.entries.map((e) => (
              <li
                key={e.userId}
                data-testid={`lb-row-${e.rank}`}
                className={cn(
                  "rounded-2xl border bg-card px-3 py-2.5 flex items-center gap-3",
                  e.userId === Number(user?.id)
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/60",
                )}
              >
                <span
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    e.rank === 1 && "bg-amber-400 text-amber-900",
                    e.rank === 2 && "bg-zinc-300 text-zinc-800",
                    e.rank === 3 && "bg-orange-300 text-orange-900",
                    e.rank > 3 && "bg-muted text-muted-foreground",
                  )}
                >
                  {e.rank <= 3 ? <Crown className="h-4 w-4" /> : e.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {e.userName || `User #${e.userId}`}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span>{e.attempts} attempts</span>
                    <span className="opacity-50">·</span>
                    <span>{e.accuracy}% accurate</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold tabular-nums text-primary">{e.points}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    pts
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Podium({
  entry,
  place,
}: {
  entry: { rank: number; userId: number; userName: string; points: number };
  place: 1 | 2 | 3;
}) {
  const heights = { 1: "h-28", 2: "h-20", 3: "h-16" };
  const colors = {
    1: "bg-amber-400 text-amber-900",
    2: "bg-zinc-300 text-zinc-800",
    3: "bg-orange-300 text-orange-900",
  } as const;
  return (
    <div className="text-center">
      <div className="text-xs font-bold truncate mb-1" data-testid={`podium-name-${place}`}>
        {entry.userName || `User #${entry.userId}`}
      </div>
      <div
        className={cn(
          "rounded-t-2xl mx-auto flex flex-col items-center justify-end p-2 text-primary-foreground shadow-md",
          heights[place],
          colors[place],
        )}
      >
        <Crown className="h-5 w-5 mb-1" />
        <div className="text-lg font-serif font-bold">{place}</div>
        <div className="text-[10px] font-bold opacity-90">{entry.points} pts</div>
      </div>
    </div>
  );
}
