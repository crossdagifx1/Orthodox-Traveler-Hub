import { Link, useLocation, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Play,
  Clock,
  Target,
  Trophy,
  GraduationCap,
  Hash,
  ScrollText,
  Pencil,
} from "lucide-react";
import {
  useQaGetQuiz,
  getQaGetQuizQueryKey,
  qaStartAttempt,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function QuizDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { isAuthed, openLogin, isStaff, user } = useAuth();
  const [starting, setStarting] = useState(false);

  const { data, isLoading } = useQaGetQuiz(id, {
    query: { queryKey: getQaGetQuizQueryKey(id) },
  });

  const start = async () => {
    if (!isAuthed) {
      openLogin(t("auth.loginRequired"));
      return;
    }
    setStarting(true);
    try {
      const r = await qaStartAttempt(id);
      navigate(`/learn/play/${r.attempt.id}`);
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t("learn.notFound")}</p>
      </div>
    );
  }

  const { quiz, questions } = data;
  const canEdit =
    isStaff && (user?.role === "admin" || user?.role === "superadmin" || quiz.authorId === Number(user?.id));

  return (
    <div className="pb-24">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <Link href="/learn">
            <Button variant="ghost" size="sm" className="rounded-full" data-testid="button-back-learn">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
            </Button>
          </Link>
          {canEdit ? (
            <Link href={`/admin/qa/${quiz.id}`}>
              <Button variant="outline" size="sm" className="rounded-full" data-testid="button-edit-quiz">
                <Pencil className="h-4 w-4 mr-1" /> {t("learn.editQuiz")}
              </Button>
            </Link>
          ) : null}
        </div>

        <div
          className="rounded-3xl p-5 text-primary-foreground relative overflow-hidden mb-4"
          style={{ background: "var(--gold-gradient)" }}
        >
          <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 space-y-1">
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-90 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              {quiz.category}
            </div>
            <h1 className="font-serif text-2xl font-bold leading-tight" data-testid="text-quiz-title">
              {quiz.title}
            </h1>
            {quiz.description ? <p className="text-sm opacity-90 mt-1">{quiz.description}</p> : null}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-1 text-xs">
                <Target className="h-3 w-3" /> {quiz.pointsTotal} {t("learn.pts")}
              </span>
              <span className="inline-flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-1 text-xs">
                <ScrollText className="h-3 w-3" /> {questions.length} Q
              </span>
              {quiz.timeLimitSeconds > 0 ? (
                <span className="inline-flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-1 text-xs">
                  <Clock className="h-3 w-3" /> {Math.round(quiz.timeLimitSeconds / 60)}m
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-1 text-xs">
                <Trophy className="h-3 w-3" /> {quiz.attemptsCount}
              </span>
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-1 bg-black/30 rounded-full px-2.5 py-1 text-xs font-mono font-bold tracking-widest",
                )}
                data-testid="text-quiz-code"
              >
                <Hash className="h-3 w-3" /> {quiz.code}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={start}
          disabled={starting || questions.length === 0}
          className="w-full h-14 rounded-full text-base font-bold"
          data-testid="button-start-quiz"
        >
          <Play className="h-5 w-5 mr-2 fill-current" />
          {starting ? "…" : questions.length === 0 ? t("learn.noQuestions") : t("learn.start")}
        </Button>

        <div className="mt-5 rounded-2xl border border-border/60 bg-card p-4">
          <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
            {t("learn.aboutAuthor")}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{quiz.authorName || "Anonymous"}</div>
              <div className="text-xs text-muted-foreground">{t("learn.teacher")}</div>
            </div>
          </div>
        </div>

        {questions.length > 0 ? (
          <div className="mt-5">
            <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2 px-1">
              {t("learn.preview")}
            </div>
            <div className="space-y-2">
              {questions.slice(0, 3).map((q, i) => (
                <div key={q.id} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                    Q{i + 1} • {q.type} • {q.points} {t("learn.pts")}
                  </div>
                  <div className="text-sm mt-1 line-clamp-2">{q.prompt}</div>
                </div>
              ))}
              {questions.length > 3 ? (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  + {questions.length - 3} {t("learn.moreQuestions")}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
