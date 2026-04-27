import { Link, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Trophy,
  RotateCcw,
  Home as HomeIcon,
  Target,
  Check,
  X,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  useQaGetAttempt,
  getQaGetAttemptQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { QuestionRenderer } from "@/components/learn/QuestionRenderer";
import { cn } from "@/lib/utils";

export function QuizResults() {
  const params = useParams<{ id: string }>();
  const attemptId = params.id;
  const { t } = useTranslation();

  const { data, isLoading } = useQaGetAttempt(attemptId, {
    query: { queryKey: getQaGetAttemptQueryKey(attemptId) },
  });

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">…</div>;

  const { attempt, quiz, questions, answers } = data;
  const answerByQ = new Map(answers.map((a) => [a.questionId, a]));
  const pct =
    attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0;
  const accuracy =
    attempt.totalCount > 0
      ? Math.round((attempt.correctCount / attempt.totalCount) * 100)
      : 0;
  const minutes = Math.floor(attempt.durationMs / 60000);
  const seconds = Math.floor((attempt.durationMs % 60000) / 1000);

  const grade =
    pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 40 ? "D" : "F";

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Hero */}
      <div
        className="rounded-3xl p-6 text-primary-foreground relative overflow-hidden text-center"
        style={{ background: "var(--gold-gradient)" }}
      >
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-black/10 blur-2xl" />
        <Trophy className="h-12 w-12 mx-auto mb-2 opacity-90" />
        <div className="text-[10px] uppercase tracking-widest font-bold opacity-90">
          {t("learn.scored")}
        </div>
        <div
          className="text-5xl font-serif font-bold mt-1 tabular-nums"
          data-testid="text-result-score"
        >
          {attempt.score}
          <span className="text-2xl opacity-80">/{attempt.totalPoints}</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-xs bg-black/20 rounded-full px-2.5 py-1">
            {pct}%
          </span>
          <span className="text-xs bg-black/20 rounded-full px-2.5 py-1 font-bold">{grade}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat icon={Target} value={`${attempt.correctCount}/${attempt.totalCount}`} label={t("learn.correct")} />
        <Stat icon={Trophy} value={`${accuracy}%`} label={t("learn.accuracy")} />
        <Stat
          icon={Clock}
          value={`${minutes}:${String(seconds).padStart(2, "0")}`}
          label={t("learn.duration")}
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Link href={quiz ? `/learn/quizzes/${quiz.id}` : "/learn"}>
          <Button variant="outline" className="w-full rounded-full" data-testid="button-retry-quiz">
            <RotateCcw className="h-4 w-4 mr-2" /> {t("learn.tryAgain")}
          </Button>
        </Link>
        <Link href="/learn/leaderboard">
          <Button className="w-full rounded-full" data-testid="button-leaderboard">
            <Trophy className="h-4 w-4 mr-2" /> {t("learn.leaderboard")}
          </Button>
        </Link>
      </div>

      {/* Per-question review */}
      <h2 className="text-sm font-bold mt-6 mb-2 px-1 uppercase tracking-widest text-muted-foreground">
        {t("learn.review")}
      </h2>
      <div className="space-y-3">
        {questions.map((q, i) => {
          const a = answerByQ.get(q.id);
          const isCorrect = !!a?.isCorrect;
          return (
            <div
              key={q.id}
              className={cn(
                "rounded-2xl border-2 p-4 bg-card",
                isCorrect
                  ? "border-emerald-200 dark:border-emerald-900"
                  : a
                  ? "border-rose-200 dark:border-rose-900"
                  : "border-border",
              )}
              data-testid={`review-question-${i}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Q{i + 1} · {q.type} · {q.points} {t("learn.pts")}
                </div>
                <span
                  className={cn(
                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                    isCorrect
                      ? "bg-emerald-100 text-emerald-700"
                      : a
                      ? "bg-rose-100 text-rose-700"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isCorrect ? (
                    <>
                      <Check className="h-3 w-3" /> +{a?.pointsEarned ?? 0}
                    </>
                  ) : a ? (
                    <>
                      <X className="h-3 w-3" /> 0
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <QuestionRenderer
                question={q as any}
                value={a?.response ?? null}
                onChange={() => {}}
                disabled
                reveal={{
                  isCorrect,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation || "",
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <Link href="/learn">
          <Button variant="ghost" className="w-full rounded-full" data-testid="button-back-learn-hub">
            <HomeIcon className="h-4 w-4 mr-2" /> {t("learn.backToHub")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Trophy;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-primary mb-1" />
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
        {label}
      </div>
    </div>
  );
}
