import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  GraduationCap,
  Trophy,
  Sparkles,
  Search,
  Hash,
  ChevronRight,
  Clock,
  Target,
  Crown,
  Flame,
  ScrollText,
  Plus,
} from "lucide-react";
import {
  useQaListQuizzes,
  getQaListQuizzesQueryKey,
  useQaListChallenges,
  getQaListChallengesQueryKey,
  useQaLeaderboard,
  getQaLeaderboardQueryKey,
  qaGetQuizByCode,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

export function Learn() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [joining, setJoining] = useState(false);
  const { isStaff } = useAuth();

  const params = { q: search || undefined, status: "published", limit: 24 };
  const { data: quizzes, isLoading } = useQaListQuizzes(params, {
    query: { queryKey: getQaListQuizzesQueryKey(params) },
  });
  const { data: challenges } = useQaListChallenges({
    query: { queryKey: getQaListChallengesQueryKey() },
  });
  const lbParams = { window: "week" as const, limit: 5 };
  const { data: leaderboard } = useQaLeaderboard(lbParams, {
    query: { queryKey: getQaLeaderboardQueryKey(lbParams) },
  });

  const submitCode = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setCodeError("");
    setJoining(true);
    try {
      const quiz = await qaGetQuizByCode(trimmed);
      navigate(`/learn/quizzes/${quiz.id}`);
    } catch {
      setCodeError(t("learn.codeNotFound"));
    } finally {
      setJoining(false);
    }
  };

  const featuredChallenge = challenges?.[0];

  return (
    <div className="pb-24">
      {/* Hero header */}
      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              {t("learn.title")}
            </h1>
            <p className="text-xs text-muted-foreground">{t("learn.subtitle")}</p>
          </div>
          <div className="flex gap-1">
            <Link href="/learn/leaderboard">
              <Button size="icon" variant="ghost" className="rounded-full" data-testid="link-learn-leaderboard">
                <Trophy className="h-5 w-5 text-primary" />
              </Button>
            </Link>
            <Link href="/learn/challenges">
              <Button size="icon" variant="ghost" className="rounded-full" data-testid="link-learn-challenges">
                <Flame className="h-5 w-5 text-primary" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("learn.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60 rounded-full"
            data-testid="input-search-quizzes"
          />
        </div>
      </header>

      <div className="px-4 mt-4 grid gap-4">
        {/* Join by code */}
        <section
          className="rounded-2xl p-4 border border-primary/20 bg-card shadow-sm"
          data-testid="section-join-by-code"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-foreground">{t("learn.joinByCodeTitle")}</div>
              <div className="text-xs text-muted-foreground">{t("learn.joinByCodeSub")}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setCodeError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submitCode()}
              placeholder="A1B2C3"
              maxLength={12}
              className="h-11 rounded-full font-mono tracking-[0.4em] text-center text-lg uppercase"
              data-testid="input-join-code"
            />
            <Button
              onClick={submitCode}
              disabled={joining || !code.trim()}
              className="h-11 rounded-full px-5"
              data-testid="button-join-code"
            >
              {t("learn.join")}
            </Button>
          </div>
          {codeError ? (
            <div className="text-xs text-rose-600 mt-2" data-testid="text-code-error">
              {codeError}
            </div>
          ) : null}
        </section>

        {/* Challenge banner */}
        {featuredChallenge ? (
          <Link href={`/learn/quizzes/${featuredChallenge.quizId}`}>
            <section
              className="rounded-2xl p-4 text-primary-foreground relative overflow-hidden cursor-pointer hover-elevate active-elevate-2"
              style={{ background: "var(--gold-gradient)" }}
              data-testid="banner-challenge"
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-90 flex items-center gap-1.5 mb-1">
                    <Flame className="h-3.5 w-3.5" />
                    {t(`learn.challengeType.${featuredChallenge.type}` as any, {
                      defaultValue: featuredChallenge.type,
                    })}
                  </div>
                  <div className="font-serif text-xl font-bold">{featuredChallenge.title}</div>
                  {featuredChallenge.description ? (
                    <p className="text-xs opacity-90 mt-1 line-clamp-2">{featuredChallenge.description}</p>
                  ) : null}
                  {featuredChallenge.prize ? (
                    <div className="mt-2 inline-flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-0.5 text-xs">
                      <Crown className="h-3 w-3" /> {featuredChallenge.prize}
                    </div>
                  ) : null}
                </div>
                <ChevronRight className="h-5 w-5" />
              </div>
            </section>
          </Link>
        ) : null}

        {/* Mini-leaderboard preview */}
        {leaderboard && Array.isArray(leaderboard.entries) && leaderboard.entries.length > 0 ? (
          <section className="rounded-2xl border border-border/60 bg-card p-3" data-testid="section-leaderboard-preview">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <div className="text-sm font-bold">{t("learn.weeklyTop")}</div>
              </div>
              <Link href="/learn/leaderboard">
                <span className="text-xs text-primary font-medium cursor-pointer">{t("nav.viewAll")}</span>
              </Link>
            </div>
            <ol className="space-y-1">
              {(Array.isArray(leaderboard.entries) ? leaderboard.entries : []).slice(0, 5).map((e) => (
                <li
                  key={e.userId}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/50"
                  data-testid={`lb-preview-${e.rank}`}
                >
                  <span
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                      e.rank === 1
                        ? "bg-amber-400/30 text-amber-700"
                        : e.rank === 2
                        ? "bg-zinc-300/40 text-zinc-700"
                        : e.rank === 3
                        ? "bg-orange-300/40 text-orange-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {e.rank}
                  </span>
                  <span className="flex-1 text-sm truncate">{e.userName || `User #${e.userId}`}</span>
                  <span className="text-sm font-bold tabular-nums">{e.points}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* Quizzes grid */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("learn.allQuizzes")}
            </h2>
            {isStaff ? (
              <Link href="/admin/qa">
                <Button size="sm" variant="outline" className="rounded-full h-8" data-testid="link-admin-qa-shortcut">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t("learn.author")}
                </Button>
              </Link>
            ) : null}
          </div>
          {isLoading ? (
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : Array.isArray(quizzes) && quizzes.length > 0 ? (
            <div className="grid gap-2">
              {quizzes.map((q) => (
                <QuizCard key={q.id} quiz={q} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <ScrollText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t("learn.empty")}</p>
              {isStaff ? (
                <Link href="/admin/qa">
                  <Button className="rounded-full mt-3" data-testid="button-create-first-quiz">
                    <Plus className="h-4 w-4 mr-1" /> {t("learn.createQuiz")}
                  </Button>
                </Link>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function QuizCard({ quiz }: { quiz: any }) {
  const { t } = useTranslation();
  const diffColor =
    quiz.difficulty === "easy"
      ? "bg-emerald-100 text-emerald-700"
      : quiz.difficulty === "medium"
      ? "bg-amber-100 text-amber-700"
      : quiz.difficulty === "hard"
      ? "bg-orange-100 text-orange-700"
      : "bg-rose-100 text-rose-700";
  return (
    <Link href={`/learn/quizzes/${quiz.id}`}>
      <div
        className="rounded-2xl border border-border/60 bg-card p-4 cursor-pointer hover-elevate active-elevate-2 active:scale-[0.99] transition-transform"
        data-testid={`quiz-card-${quiz.id}`}
      >
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground line-clamp-1">{quiz.title}</h3>
              <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full", diffColor)}>
                {quiz.difficulty}
              </span>
            </div>
            {quiz.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{quiz.description}</p>
            ) : null}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" /> {quiz.pointsTotal} {t("learn.pts")}
              </span>
              {quiz.timeLimitSeconds > 0 ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {Math.round(quiz.timeLimitSeconds / 60)}m
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" /> {quiz.attemptsCount}
              </span>
              <span className="ml-auto font-mono text-primary font-bold">#{quiz.code}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
