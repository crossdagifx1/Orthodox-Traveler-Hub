import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Hash,
  Eye,
  EyeOff,
  Pencil,
  Play,
} from "lucide-react";
import {
  useQaGetQuiz,
  getQaGetQuizQueryKey,
  qaUpdateQuiz,
  qaCreateQuestion,
  qaUpdateQuestion,
  qaDeleteQuestion,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TYPES = ["mcq", "multi", "truefalse", "short", "fill", "ordering"] as const;
type QType = (typeof TYPES)[number];

export function AdminQuizEdit() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation();
  const { user, isStaff } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQaGetQuiz(id, {
    query: { queryKey: getQaGetQuizQueryKey(id), enabled: isStaff },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [difficulty, setDifficulty] = useState("easy");
  const [timeLimit, setTimeLimit] = useState(0);
  const [savingMeta, setSavingMeta] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setTitle(data.quiz.title);
    setDescription(data.quiz.description);
    setCategory(data.quiz.category);
    setDifficulty(data.quiz.difficulty);
    setTimeLimit(data.quiz.timeLimitSeconds);
  }, [data]);

  const refresh = () =>
    qc.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && String(q.queryKey[0] ?? "").includes("/qa/quizzes"),
    });

  if (!isStaff) {
    return <div className="p-8 text-center text-muted-foreground">{t("admin.accessDenied")}</div>;
  }
  if (isLoading || !data) {
    return <div className="p-8 text-center text-muted-foreground">…</div>;
  }

  const { quiz, questions } = data;
  const canEdit =
    user?.role === "admin" ||
    user?.role === "superadmin" ||
    quiz.authorId === Number(user?.id);

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      await qaUpdateQuiz(id, {
        title,
        description,
        category,
        difficulty: difficulty as any,
        timeLimitSeconds: timeLimit,
      });
      toast({ title: t("learn.saved") });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setSavingMeta(false);
    }
  };

  const togglePublish = async () => {
    await qaUpdateQuiz(id, { status: quiz.status === "published" ? "draft" : "published" });
    await refresh();
  };

  return (
    <div className="pb-24">
      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40">
        <div className="flex items-center justify-between">
          <Link href="/admin/qa">
            <Button variant="ghost" size="sm" className="rounded-full" data-testid="button-back-admin-qa">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
            </Button>
          </Link>
          <div className="flex gap-1">
            <Link href={`/learn/quizzes/${id}`}>
              <Button variant="outline" size="sm" className="rounded-full" data-testid="button-preview-quiz">
                <Play className="h-4 w-4 mr-1" /> {t("admin.qa.preview")}
              </Button>
            </Link>
            {canEdit ? (
              <Button
                size="sm"
                variant={quiz.status === "published" ? "outline" : "default"}
                className="rounded-full"
                onClick={togglePublish}
                data-testid="button-toggle-publish"
              >
                {quiz.status === "published" ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" /> {t("admin.qa.unpublish")}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" /> {t("admin.qa.publish")}
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Quiz meta */}
        <section className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-1.5">
              <Pencil className="h-4 w-4" /> {t("admin.qa.metaSection")}
            </h2>
            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Hash className="h-3 w-3" /> {quiz.code}
            </span>
          </div>
          <div className="grid gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("admin.qa.titlePlaceholder")}
              className="rounded-xl"
              disabled={!canEdit}
              data-testid="input-quiz-title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("admin.qa.descPlaceholder")}
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
              disabled={!canEdit}
              data-testid="input-quiz-description"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="rounded-xl"
                disabled={!canEdit}
                data-testid="input-quiz-category"
              />
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="rounded-xl bg-background border border-border px-3 text-sm"
                disabled={!canEdit}
                data-testid="select-quiz-difficulty"
              >
                {["easy", "medium", "hard", "expert"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Input
                  type="number"
                  value={timeLimit}
                  min={0}
                  max={7200}
                  onChange={(e) => setTimeLimit(Number(e.target.value) || 0)}
                  placeholder="Time (s)"
                  className="rounded-xl pr-8"
                  disabled={!canEdit}
                  data-testid="input-quiz-time-limit"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  sec
                </span>
              </div>
            </div>
          </div>
          {canEdit ? (
            <Button
              onClick={saveMeta}
              disabled={savingMeta}
              className="rounded-full"
              data-testid="button-save-quiz-meta"
            >
              <Save className="h-4 w-4 mr-1" /> {savingMeta ? "…" : t("admin.qa.saveMeta")}
            </Button>
          ) : null}
        </section>

        {/* Questions */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-bold">
              {t("admin.qa.questions")} ({questions.length})
            </h2>
          </div>

          <div className="space-y-2">
            {questions.map((q, i) => (
              <QuestionRow
                key={q.id}
                index={i}
                question={q as any}
                quizId={id}
                canEdit={canEdit}
                isEditing={editingId === q.id}
                onStartEdit={() => setEditingId(q.id)}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  void refresh();
                }}
              />
            ))}
          </div>

          {canEdit ? (
            <div className="mt-3">
              <NewQuestionPanel
                quizId={id}
                onCreated={() => refresh()}
              />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

// ─────────── Question row (view + inline edit) ───────────

function QuestionRow({
  index,
  question,
  quizId,
  canEdit,
  isEditing,
  onStartEdit,
  onCancel,
  onSaved,
}: {
  index: number;
  question: any;
  quizId: string;
  canEdit: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const remove = async () => {
    if (!confirm("Delete this question?")) return;
    try {
      await qaDeleteQuestion(question.id);
      toast({ title: "Deleted" });
      onSaved();
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    }
  };

  if (isEditing) {
    return (
      <QuestionEditor
        quizId={quizId}
        existing={question}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );
  }

  return (
    <div
      className="rounded-2xl border border-border/60 bg-card p-3"
      data-testid={`admin-question-row-${question.id}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            Q{index + 1} · {question.type} · {question.points} pts
          </div>
          <div className="text-sm mt-1 line-clamp-2">{question.prompt}</div>
        </div>
        {canEdit ? (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full"
              onClick={onStartEdit}
              data-testid={`button-edit-question-${question.id}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full text-destructive"
              onClick={remove}
              data-testid={`button-delete-question-${question.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─────────── New question panel (collapses to add button) ───────────

function NewQuestionPanel({ quizId, onCreated }: { quizId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button
        variant="outline"
        className="w-full rounded-full border-dashed"
        onClick={() => setOpen(true)}
        data-testid="button-add-question"
      >
        <Plus className="h-4 w-4 mr-1" /> Add question
      </Button>
    );
  return (
    <QuestionEditor
      quizId={quizId}
      onCancel={() => setOpen(false)}
      onSaved={() => {
        setOpen(false);
        onCreated();
      }}
    />
  );
}

// ─────────── Question editor (create or edit) ───────────

function QuestionEditor({
  quizId,
  existing,
  onCancel,
  onSaved,
}: {
  quizId: string;
  existing?: any;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [type, setType] = useState<QType>(existing?.type ?? "mcq");
  const [prompt, setPrompt] = useState(existing?.prompt ?? "");
  const [explanation, setExplanation] = useState(existing?.explanation ?? "");
  const [points, setPoints] = useState(existing?.points ?? 10);
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? "");

  // Per-type state
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>(
    Array.isArray(existing?.options) && (existing.type === "mcq" || existing.type === "multi" || existing.type === "ordering")
      ? (existing.options as any[]).map((o: any) => ({ id: String(o.id), text: String(o.text) }))
      : [
          { id: "a", text: "" },
          { id: "b", text: "" },
        ],
  );
  const [mcqCorrect, setMcqCorrect] = useState<string>(
    existing?.type === "mcq" && typeof existing?.correctAnswer === "string"
      ? existing.correctAnswer
      : "a",
  );
  const [multiCorrect, setMultiCorrect] = useState<string[]>(
    existing?.type === "multi" && Array.isArray(existing?.correctAnswer)
      ? (existing.correctAnswer as string[])
      : [],
  );
  const [tfCorrect, setTfCorrect] = useState<"true" | "false">(
    existing?.type === "truefalse" && existing?.correctAnswer === "false" ? "false" : "true",
  );
  const [shortAnswer, setShortAnswer] = useState<string>(
    existing?.type === "short" && typeof existing?.correctAnswer === "string"
      ? existing.correctAnswer
      : "",
  );
  const [blanks, setBlanks] = useState<number>(
    existing?.type === "fill" && existing?.options && typeof (existing.options as any).blanks === "number"
      ? (existing.options as any).blanks
      : 1,
  );
  const [fillAnswers, setFillAnswers] = useState<string[]>(
    existing?.type === "fill" && Array.isArray(existing?.correctAnswer)
      ? (existing.correctAnswer as string[])
      : [""],
  );
  const [orderingCorrect, setOrderingCorrect] = useState<string[]>(
    existing?.type === "ordering" && Array.isArray(existing?.correctAnswer)
      ? (existing.correctAnswer as string[])
      : ["a", "b"],
  );

  // Keep ordering & options in sync.
  useEffect(() => {
    if (type !== "ordering") return;
    setOrderingCorrect(options.map((o) => o.id));
  }, [type, options]);
  useEffect(() => {
    if (type !== "fill") return;
    setFillAnswers((arr) => {
      const next = [...arr];
      while (next.length < blanks) next.push("");
      next.length = blanks;
      return next;
    });
  }, [blanks, type]);

  const addOption = () => {
    const used = new Set(options.map((o) => o.id));
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const id = alphabet.split("").find((c) => !used.has(c)) ?? `o${options.length + 1}`;
    setOptions([...options, { id, text: "" }]);
  };
  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const next = options.filter((_, i) => i !== idx);
    setOptions(next);
    if (mcqCorrect && !next.some((o) => o.id === mcqCorrect)) setMcqCorrect(next[0]?.id ?? "");
    setMultiCorrect((prev) => prev.filter((x) => next.some((o) => o.id === x)));
  };

  const buildPayload = () => {
    const base: any = {
      type,
      prompt: prompt.trim(),
      explanation,
      imageUrl,
      points,
    };
    if (type === "mcq") {
      base.options = options;
      base.correctAnswer = mcqCorrect;
    } else if (type === "multi") {
      base.options = options;
      base.correctAnswer = multiCorrect;
    } else if (type === "truefalse") {
      base.options = [];
      base.correctAnswer = tfCorrect;
    } else if (type === "short") {
      base.options = [];
      base.correctAnswer = shortAnswer.trim();
    } else if (type === "fill") {
      base.options = { blanks };
      base.correctAnswer = fillAnswers;
    } else if (type === "ordering") {
      base.options = options;
      base.correctAnswer = orderingCorrect;
    }
    return base;
  };

  const valid = useMemo(() => {
    if (!prompt.trim()) return false;
    if (type === "mcq") return options.length >= 2 && options.every((o) => o.text.trim()) && !!mcqCorrect;
    if (type === "multi") return options.length >= 2 && options.every((o) => o.text.trim()) && multiCorrect.length > 0;
    if (type === "truefalse") return true;
    if (type === "short") return shortAnswer.trim().length > 0;
    if (type === "fill") return blanks > 0 && fillAnswers.every((a) => a.trim());
    if (type === "ordering") return options.length >= 2 && options.every((o) => o.text.trim());
    return false;
  }, [type, prompt, options, mcqCorrect, multiCorrect, tfCorrect, shortAnswer, blanks, fillAnswers]);

  const save = async () => {
    try {
      if (existing) {
        await qaUpdateQuestion(existing.id, buildPayload());
      } else {
        await qaCreateQuestion(quizId, buildPayload());
      }
      toast({ title: existing ? "Updated" : "Added" });
      onSaved();
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-card p-4 space-y-3" data-testid="question-editor">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest font-bold text-primary">
          {existing ? "Edit question" : "New question"}
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as QType)}
          className="rounded-full bg-background border border-border px-3 py-1 text-sm"
          data-testid="select-question-type"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder="Question prompt"
        className="w-full rounded-xl border border-border bg-background p-3 text-sm"
        data-testid="input-question-prompt"
      />

      {/* Per-type editor */}
      {(type === "mcq" || type === "multi" || type === "ordering") && (
        <div className="space-y-1.5">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              {type === "mcq" ? (
                <input
                  type="radio"
                  checked={mcqCorrect === o.id}
                  onChange={() => setMcqCorrect(o.id)}
                  data-testid={`radio-correct-${i}`}
                />
              ) : type === "multi" ? (
                <input
                  type="checkbox"
                  checked={multiCorrect.includes(o.id)}
                  onChange={(e) => {
                    setMultiCorrect((prev) =>
                      e.target.checked ? [...prev, o.id] : prev.filter((x) => x !== o.id),
                    );
                  }}
                  data-testid={`checkbox-correct-${i}`}
                />
              ) : (
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                  {String.fromCharCode(65 + i)}
                </span>
              )}
              <Input
                value={o.text}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = { ...o, text: e.target.value };
                  setOptions(next);
                }}
                placeholder={`Option ${o.id}`}
                className="rounded-xl"
                data-testid={`input-option-${i}`}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => removeOption(i)}
                disabled={options.length <= 2}
                data-testid={`button-remove-option-${i}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={addOption}
            data-testid="button-add-option"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add option
          </Button>
        </div>
      )}
      {type === "truefalse" && (
        <div className="flex gap-2">
          {(["true", "false"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTfCorrect(k)}
              data-testid={`tf-correct-${k}`}
              className={cn(
                "flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold capitalize",
                tfCorrect === k ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
              )}
            >
              {k}
            </button>
          ))}
        </div>
      )}
      {type === "short" && (
        <Input
          value={shortAnswer}
          onChange={(e) => setShortAnswer(e.target.value)}
          placeholder="Correct answer (case-insensitive)"
          className="rounded-xl"
          data-testid="input-short-answer"
        />
      )}
      {type === "fill" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Blanks:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={blanks}
              onChange={(e) => setBlanks(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="w-20 rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
              data-testid="input-blanks-count"
            />
          </div>
          {Array.from({ length: blanks }).map((_, i) => (
            <Input
              key={i}
              value={fillAnswers[i] ?? ""}
              onChange={(e) => {
                const next = [...fillAnswers];
                next[i] = e.target.value;
                setFillAnswers(next);
              }}
              placeholder={`Blank #${i + 1}`}
              className="rounded-xl"
              data-testid={`input-fill-correct-${i}`}
            />
          ))}
        </div>
      )}

      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        rows={2}
        placeholder="Explanation (shown after answer)"
        className="w-full rounded-xl border border-border bg-background p-3 text-sm"
        data-testid="input-question-explanation"
      />

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Points:</span>
        <input
          type="number"
          min={1}
          max={1000}
          value={points}
          onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 10))}
          className="w-24 rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
          data-testid="input-question-points"
        />
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL (optional)"
          className="rounded-xl text-xs flex-1"
          data-testid="input-question-image"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel} className="rounded-full" data-testid="button-cancel-question">
          Cancel
        </Button>
        <Button onClick={save} disabled={!valid} className="rounded-full" data-testid="button-save-question">
          <Save className="h-4 w-4 mr-1" /> Save question
        </Button>
      </div>
    </div>
  );
}
