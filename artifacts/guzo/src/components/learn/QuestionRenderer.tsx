import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X, GripVertical, ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuestionType = "mcq" | "multi" | "truefalse" | "short" | "fill" | "ordering";

export type Question = {
  id: string;
  type: string;
  prompt: string;
  options?: unknown;
  imageUrl?: string;
  points: number;
  position: number;
};

type Props = {
  question: Question;
  /** Current value (controlled). Shape depends on type. */
  value: unknown;
  onChange: (v: unknown) => void;
  /** When set, the question is locked and shows whether each choice is correct. */
  reveal?: {
    isCorrect: boolean;
    correctAnswer: unknown;
    explanation?: string;
  };
  disabled?: boolean;
};

export function QuestionRenderer({ question, value, onChange, reveal, disabled }: Props) {
  const t = question.type as QuestionType;
  const locked = !!reveal || !!disabled;

  return (
    <div className="flex flex-col gap-4">
      {question.imageUrl ? (
        <div className="rounded-2xl overflow-hidden bg-muted aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        </div>
      ) : null}

      <p className="text-base leading-relaxed font-medium" data-testid={`question-prompt-${question.id}`}>
        {question.prompt}
      </p>

      {t === "mcq" && (
        <McqInput question={question} value={value as string | null} onChange={onChange} reveal={reveal} locked={locked} />
      )}
      {t === "multi" && (
        <MultiInput question={question} value={(value as string[]) ?? []} onChange={onChange} reveal={reveal} locked={locked} />
      )}
      {t === "truefalse" && (
        <TrueFalseInput value={value as string | null} onChange={onChange} reveal={reveal} locked={locked} />
      )}
      {t === "short" && (
        <ShortInput value={(value as string) ?? ""} onChange={onChange} reveal={reveal} locked={locked} qid={question.id} />
      )}
      {t === "fill" && (
        <FillInput question={question} value={(value as string[]) ?? []} onChange={onChange} reveal={reveal} locked={locked} />
      )}
      {t === "ordering" && (
        <OrderingInput question={question} value={(value as string[]) ?? []} onChange={onChange} reveal={reveal} locked={locked} />
      )}

      {reveal?.explanation ? (
        <div
          className={cn(
            "rounded-xl p-3 border text-sm",
            reveal.isCorrect
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200"
              : "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200",
          )}
          data-testid={`explanation-${question.id}`}
        >
          <div className="font-semibold mb-1 flex items-center gap-1.5">
            {reveal.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {reveal.isCorrect ? "Correct" : "Not quite"}
          </div>
          {reveal.explanation}
        </div>
      ) : null}
    </div>
  );
}

// ───────────────────────────── MCQ ─────────────────────────────

function McqInput({
  question,
  value,
  onChange,
  reveal,
  locked,
}: {
  question: Question;
  value: string | null;
  onChange: (v: unknown) => void;
  reveal?: Props["reveal"];
  locked: boolean;
}) {
  const opts = (Array.isArray(question.options) ? question.options : []) as Array<{ id: string; text: string }>;
  const correct = (reveal?.correctAnswer ?? null) as string | null;
  return (
    <div className="grid gap-2">
      {opts.map((o) => {
        const selected = value === o.id;
        const isRight = reveal && correct === o.id;
        const isWrongSelected = reveal && selected && !isRight;
        return (
          <button
            key={o.id}
            type="button"
            disabled={locked}
            onClick={() => onChange(o.id)}
            data-testid={`option-${question.id}-${o.id}`}
            className={cn(
              "text-left rounded-xl border-2 px-4 py-3 transition-all hover-elevate active-elevate-2 flex items-center gap-3",
              selected ? "border-primary bg-primary/5" : "border-border bg-card",
              isRight && "!border-emerald-500 !bg-emerald-50 dark:!bg-emerald-950/40",
              isWrongSelected && "!border-rose-500 !bg-rose-50 dark:!bg-rose-950/40",
            )}
          >
            <span
              className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                selected ? "border-primary" : "border-muted-foreground/40",
                isRight && "!border-emerald-600 bg-emerald-600 text-white",
                isWrongSelected && "!border-rose-600 bg-rose-600 text-white",
              )}
            >
              {(selected || isRight) && <span className="h-2 w-2 rounded-full bg-current" />}
              {isWrongSelected && <X className="h-3 w-3" />}
            </span>
            <span className="flex-1 text-sm">{o.text}</span>
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────────── MULTI ─────────────────────────────

function MultiInput({
  question,
  value,
  onChange,
  reveal,
  locked,
}: {
  question: Question;
  value: string[];
  onChange: (v: unknown) => void;
  reveal?: Props["reveal"];
  locked: boolean;
}) {
  const opts = (Array.isArray(question.options) ? question.options : []) as Array<{ id: string; text: string }>;
  const correctSet = useMemo(() => {
    const arr = Array.isArray(reveal?.correctAnswer) ? (reveal!.correctAnswer as string[]) : [];
    return new Set(arr);
  }, [reveal]);
  const toggle = (id: string) => {
    if (locked) return;
    const set = new Set(value);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange(Array.from(set));
  };
  return (
    <div className="grid gap-2">
      <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
        Pick all that apply
      </div>
      {opts.map((o) => {
        const selected = value.includes(o.id);
        const isRight = reveal && correctSet.has(o.id);
        const isWrongSelected = reveal && selected && !isRight;
        return (
          <button
            key={o.id}
            type="button"
            disabled={locked}
            onClick={() => toggle(o.id)}
            data-testid={`option-${question.id}-${o.id}`}
            className={cn(
              "text-left rounded-xl border-2 px-4 py-3 transition-all hover-elevate active-elevate-2 flex items-center gap-3",
              selected ? "border-primary bg-primary/5" : "border-border bg-card",
              isRight && "!border-emerald-500 !bg-emerald-50 dark:!bg-emerald-950/40",
              isWrongSelected && "!border-rose-500 !bg-rose-50 dark:!bg-rose-950/40",
            )}
          >
            <span
              className={cn(
                "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                isRight && "!border-emerald-600 bg-emerald-600 text-white",
                isWrongSelected && "!border-rose-600 bg-rose-600 text-white",
              )}
            >
              {(selected || isRight) && <Check className="h-3 w-3" />}
              {isWrongSelected && <X className="h-3 w-3" />}
            </span>
            <span className="flex-1 text-sm">{o.text}</span>
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────────── TRUE/FALSE ─────────────────────────────

function TrueFalseInput({
  value,
  onChange,
  reveal,
  locked,
}: {
  value: string | null;
  onChange: (v: unknown) => void;
  reveal?: Props["reveal"];
  locked: boolean;
}) {
  const correct = reveal?.correctAnswer as string | undefined;
  const renderBtn = (k: "true" | "false", label: string) => {
    const selected = value === k;
    const isRight = reveal && correct === k;
    const isWrongSelected = reveal && selected && !isRight;
    return (
      <button
        type="button"
        disabled={locked}
        onClick={() => onChange(k)}
        data-testid={`option-tf-${k}`}
        className={cn(
          "flex-1 rounded-xl border-2 px-4 py-4 text-base font-semibold transition-all hover-elevate active-elevate-2",
          selected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card",
          isRight && "!border-emerald-500 !bg-emerald-50 dark:!bg-emerald-950/40 !text-emerald-700",
          isWrongSelected && "!border-rose-500 !bg-rose-50 dark:!bg-rose-950/40 !text-rose-700",
        )}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="flex gap-3">
      {renderBtn("true", "True")}
      {renderBtn("false", "False")}
    </div>
  );
}

// ───────────────────────────── SHORT ─────────────────────────────

function ShortInput({
  value,
  onChange,
  reveal,
  locked,
  qid,
}: {
  value: string;
  onChange: (v: unknown) => void;
  reveal?: Props["reveal"];
  locked: boolean;
  qid: string;
}) {
  return (
    <div className="space-y-2">
      <Input
        value={value}
        disabled={locked}
        placeholder="Type your answer…"
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl text-base"
        data-testid={`input-short-${qid}`}
      />
      {reveal && !reveal.isCorrect && typeof reveal.correctAnswer === "string" ? (
        <div className="text-xs text-muted-foreground">
          Correct answer: <span className="font-semibold text-foreground">{reveal.correctAnswer}</span>
        </div>
      ) : null}
    </div>
  );
}

// ───────────────────────────── FILL ─────────────────────────────

function FillInput({
  question,
  value,
  onChange,
  reveal,
  locked,
}: {
  question: Question;
  value: string[];
  onChange: (v: unknown) => void;
  reveal?: Props["reveal"];
  locked: boolean;
}) {
  const opts = (question.options as { blanks: number; hints?: string[] }) ?? { blanks: 1 };
  const correct = Array.isArray(reveal?.correctAnswer) ? (reveal!.correctAnswer as string[]) : [];
  const setIdx = (i: number, v: string) => {
    const next = [...value];
    while (next.length < opts.blanks) next.push("");
    next[i] = v;
    onChange(next);
  };
  return (
    <div className="grid gap-2">
      {Array.from({ length: opts.blanks }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 text-center text-sm font-bold text-muted-foreground">#{i + 1}</span>
          <Input
            value={value[i] ?? ""}
            disabled={locked}
            placeholder={opts.hints?.[i] ?? "Fill in the blank"}
            onChange={(e) => setIdx(i, e.target.value)}
            className="h-11 rounded-xl"
            data-testid={`input-fill-${question.id}-${i}`}
          />
          {reveal && correct[i] ? (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded font-medium",
                value[i]?.trim().toLowerCase() === correct[i].toLowerCase()
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800",
              )}
            >
              {correct[i]}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────── ORDERING ─────────────────────────────

function OrderingInput({
  question,
  value,
  onChange,
  reveal,
  locked,
}: {
  question: Question;
  value: string[];
  onChange: (v: unknown) => void;
  reveal?: Props["reveal"];
  locked: boolean;
}) {
  const opts = (Array.isArray(question.options) ? question.options : []) as Array<{ id: string; text: string }>;
  const correctOrder = Array.isArray(reveal?.correctAnswer) ? (reveal!.correctAnswer as string[]) : [];
  // Initialize order from value or fallback to options' natural order.
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    if (Array.isArray(value) && value.length === opts.length) {
      initialized.current = true;
      return;
    }
    onChange(opts.map((o) => o.id));
    initialized.current = true;
  }, [opts, value, onChange]);

  const order = (value && value.length === opts.length ? value : opts.map((o) => o.id)) as string[];
  const move = (i: number, dir: -1 | 1) => {
    if (locked) return;
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="grid gap-2">
      <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
        Tap arrows to reorder (top = first)
      </div>
      {order.map((id, i) => {
        const opt = opts.find((o) => o.id === id);
        const correctIdx = correctOrder.indexOf(id);
        const isInRightPlace = reveal && correctIdx === i;
        const isWrongPlace = reveal && correctIdx !== i;
        return (
          <div
            key={id}
            className={cn(
              "rounded-xl border-2 px-3 py-2.5 flex items-center gap-2 bg-card",
              "border-border",
              isInRightPlace && "!border-emerald-500 !bg-emerald-50 dark:!bg-emerald-950/40",
              isWrongPlace && "!border-rose-500 !bg-rose-50 dark:!bg-rose-950/40",
            )}
            data-testid={`order-item-${question.id}-${id}`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
            <span className="flex-1 text-sm">{opt?.text ?? id}</span>
            <Button
              size="icon"
              variant="ghost"
              disabled={locked || i === 0}
              onClick={() => move(i, -1)}
              data-testid={`order-up-${question.id}-${id}`}
              className="h-8 w-8 rounded-full"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={locked || i === order.length - 1}
              onClick={() => move(i, 1)}
              data-testid={`order-down-${question.id}-${id}`}
              className="h-8 w-8 rounded-full"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      {reveal && !reveal.isCorrect && correctOrder.length ? (
        <div className="text-xs text-muted-foreground mt-1">
          Correct order:{" "}
          {correctOrder.map((id, i) => {
            const opt = opts.find((o) => o.id === id);
            return (
              <span key={id} className="font-semibold text-foreground">
                {opt?.text ?? id}
                {i < correctOrder.length - 1 ? " → " : ""}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function isAnswerEmpty(type: QuestionType, v: unknown): boolean {
  if (v == null) return true;
  if (type === "mcq" || type === "truefalse") return typeof v !== "string" || !v;
  if (type === "short") return typeof v !== "string" || !v.trim();
  if (type === "multi" || type === "ordering") return !Array.isArray(v) || v.length === 0;
  if (type === "fill") return !Array.isArray(v) || v.every((x) => !x || !String(x).trim());
  return true;
}
