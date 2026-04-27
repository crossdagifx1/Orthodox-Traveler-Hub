import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Check,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";
import {
  useQaGetAttempt,
  getQaGetAttemptQueryKey,
  qaSubmitAnswer,
  qaFinishAttempt,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { QuestionRenderer, isAnswerEmpty, type QuestionType } from "@/components/learn/QuestionRenderer";
import { cn } from "@/lib/utils";

type RevealMap = Record<
  string,
  { isCorrect: boolean; correctAnswer: unknown; explanation: string }
>;

export function QuizPlayer() {
  const params = useParams<{ id: string }>();
  const attemptId = params.id;
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  // Fetch attempt+questions (no correct answers) once.
  const { data, isLoading } = useQaGetAttempt(attemptId, {
    query: {
      queryKey: getQaGetAttemptQueryKey(attemptId),
      // never refetch in middle of attempt
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  });

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [reveals, setReveals] = useState<RevealMap>({});
  const [score, setScore] = useState(0);
  const [submittingNext, setSubmittingNext] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const startedRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());

  // Quiz timer (only if quiz has timeLimitSeconds).
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!data?.quiz) return;
    const tl = data.quiz.timeLimitSeconds;
    if (!tl) return;
    const startedAt = new Date(data.attempt.startedAt).getTime();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setTimeLeft(Math.max(0, tl - elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data]);

  // Auto-finish if timer hits zero.
  useEffect(() => {
    if (timeLeft === 0 && data?.attempt.status === "in_progress" && !finishing) {
      void finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Reset question timer on idx change.
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [idx]);

  const questions = data?.questions ?? [];
  const total = questions.length;
  const cur = questions[idx];
  const curAnswer = cur ? answers[cur.id] : undefined;
  const curReveal = cur ? reveals[cur.id] : undefined;

  const submitCurrent = async (advance: boolean) => {
    if (!cur) return;
    if (curReveal) {
      // already revealed — just advance
      if (advance && idx < total - 1) setIdx(idx + 1);
      return;
    }
    setSubmittingNext(true);
    try {
      const timeSpent = Date.now() - questionStartRef.current;
      const r = await qaSubmitAnswer(attemptId, {
        questionId: Number(cur.id),
        response: curAnswer ?? null,
        timeSpentMs: timeSpent,
      });
      setReveals((prev) => ({
        ...prev,
        [cur.id]: {
          isCorrect: r.answer.isCorrect,
          correctAnswer: r.correctAnswer ?? null,
          explanation: r.explanation ?? "",
        },
      }));
      setScore(r.score ?? 0);
      if (advance && idx < total - 1) setIdx(idx + 1);
    } finally {
      setSubmittingNext(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      // Make sure last visible question is submitted.
      if (cur && !curReveal && !isAnswerEmpty(cur.type as QuestionType, curAnswer)) {
        await submitCurrent(false);
      }
      await qaFinishAttempt(attemptId);
      navigate(`/learn/results/${attemptId}`);
    } finally {
      setFinishing(false);
    }
  };

  const progress = useMemo(() => {
    if (!total) return 0;
    return Math.round(((idx + (curReveal ? 1 : 0)) / total) * 100);
  }, [idx, total, curReveal]);

  if (isLoading || !data) {
    return <div className="p-8 text-center text-muted-foreground">…</div>;
  }
  if (data.attempt.status === "completed") {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-muted-foreground">{t("learn.attemptAlreadyDone")}</p>
        <Link href={`/learn/results/${attemptId}`}>
          <Button className="rounded-full" data-testid="button-view-results">
            {t("learn.viewResults")}
          </Button>
        </Link>
      </div>
    );
  }
  if (!cur) {
    return <div className="p-8 text-center text-muted-foreground">{t("learn.noQuestions")}</div>;
  }

  return (
    <div className="pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">
              Q {idx + 1} / {total}
            </span>
            <span className="opacity-60">·</span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" /> {score}/{data.attempt.totalPoints}
            </span>
          </div>
          {timeLeft !== null ? (
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold tabular-nums px-2.5 py-1 rounded-full border",
                timeLeft < 30
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-border bg-card text-foreground",
              )}
              data-testid="text-time-left"
            >
              <Clock className="h-3.5 w-3.5" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          ) : null}
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="px-4 pt-5">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="text-[10px] uppercase tracking-widest font-bold text-primary mb-3">
            {cur.type} · {cur.points} {t("learn.pts")}
          </div>
          <QuestionRenderer
            question={cur as any}
            value={curAnswer}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [cur.id]: v }))}
            reveal={curReveal}
            disabled={!!curReveal}
          />
        </div>

        {/* Question pager */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            data-testid="button-prev-question"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {!curReveal ? (
            <Button
              onClick={() => submitCurrent(false)}
              disabled={submittingNext || isAnswerEmpty(cur.type as QuestionType, curAnswer)}
              className="rounded-full flex-1 h-11"
              data-testid="button-submit-answer"
            >
              <Check className="h-4 w-4 mr-2" />
              {submittingNext ? "…" : t("learn.checkAnswer")}
            </Button>
          ) : idx < total - 1 ? (
            <Button
              onClick={() => setIdx(idx + 1)}
              className="rounded-full flex-1 h-11"
              data-testid="button-next-question"
            >
              {t("learn.next")} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={finish}
              disabled={finishing}
              className="rounded-full flex-1 h-11 bg-primary"
              data-testid="button-finish-quiz"
            >
              <Flag className="h-4 w-4 mr-2" />
              {finishing ? "…" : t("learn.finish")}
            </Button>
          )}

          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setIdx(Math.min(total - 1, idx + 1))}
            disabled={idx === total - 1}
            data-testid="button-skip-question"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Question dots */}
        <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
          {questions.map((q, i) => {
            const r = reveals[q.id];
            return (
              <button
                key={q.id}
                onClick={() => setIdx(i)}
                data-testid={`dot-question-${i}`}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  i === idx ? "w-7 bg-primary" : "w-2.5",
                  !r && i !== idx && "bg-muted",
                  r?.isCorrect && "bg-emerald-500",
                  r && !r.isCorrect && "bg-rose-500",
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
