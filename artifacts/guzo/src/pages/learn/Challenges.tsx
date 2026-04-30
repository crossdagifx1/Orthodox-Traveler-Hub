import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Flame, Crown, Clock, ChevronRight, ScrollText } from "lucide-react";
import {
  useQaListChallenges,
  getQaListChallengesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Challenges() {
  const { t } = useTranslation();
  const { data, isLoading } = useQaListChallenges({
    query: { queryKey: getQaListChallengesQueryKey() },
  });

  return (
    <div className="pb-24">
      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40">
        <div className="flex items-center justify-between">
          <Link href="/learn">
            <Button variant="ghost" size="sm" className="rounded-full" data-testid="button-back-learn">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
            </Button>
          </Link>
          <div className="flex items-center gap-1.5 text-primary">
            <Flame className="h-4 w-4" />
            <span className="text-xs uppercase tracking-widest font-bold">
              {t("learn.activeChallenges")}
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <ScrollText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t("learn.noChallenges")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(data) ? data : []).map((c) => {
              const endsIn = Math.max(
                0,
                Math.floor((new Date(c.endsAt).getTime() - Date.now()) / 1000),
              );
              const days = Math.floor(endsIn / 86400);
              const hours = Math.floor((endsIn % 86400) / 3600);
              const minutes = Math.floor((endsIn % 3600) / 60);
              return (
                <Link key={c.id} href={`/learn/quizzes/${c.quizId}`}>
                  <div
                    className={cn(
                      "rounded-2xl p-4 text-primary-foreground relative overflow-hidden cursor-pointer hover-elevate active-elevate-2",
                      c.type === "monthly" && "bg-gradient-to-br from-purple-500 to-purple-700",
                      c.type === "weekly" && "",
                      c.type === "flash" && "bg-gradient-to-br from-rose-500 to-rose-700",
                      c.type === "custom" && "bg-gradient-to-br from-sky-500 to-indigo-700",
                    )}
                    style={
                      c.type === "weekly"
                        ? { background: "var(--gold-gradient)" }
                        : undefined
                    }
                    data-testid={`challenge-card-${c.id}`}
                  >
                    <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-90 inline-flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {t(`learn.challengeType.${c.type}` as any, { defaultValue: c.type })}
                        </span>
                        <ChevronRight className="h-5 w-5" />
                      </div>
                      <div className="font-serif text-xl font-bold leading-tight">{c.title}</div>
                      {c.description ? (
                        <p className="text-sm opacity-90 mt-1 line-clamp-2">{c.description}</p>
                      ) : null}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {c.prize ? (
                          <span className="inline-flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-1 text-xs">
                            <Crown className="h-3 w-3" /> {c.prize}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {days > 0
                            ? `${days}d ${hours}h`
                            : hours > 0
                            ? `${hours}h ${minutes}m`
                            : `${minutes}m`}{" "}
                          {t("learn.left")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
