import { Router, type IRouter } from "express";
import {
  db,
  quizzesTable,
  quizQuestionsTable,
  quizAttemptsTable,
  quizAnswersTable,
  quizChallengesTable,
} from "@workspace/db";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { requireAuth, requireRole, hasRoleAtLeast } from "../lib/auth";
import { recordAudit } from "../lib/audit";
import { randomBytes } from "node:crypto";

const router: IRouter = Router();

// ───────────────────────────── Helpers ─────────────────────────────

const QUESTION_TYPES = ["mcq", "multi", "truefalse", "short", "fill", "ordering"] as const;
type QuestionType = (typeof QUESTION_TYPES)[number];
const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
const QUIZ_STATUSES = ["draft", "published", "archived"] as const;
const CHALLENGE_TYPES = ["weekly", "monthly", "flash", "custom"] as const;

function generateCode(len = 6): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // omit confusable chars
  const buf = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[buf[i] % alphabet.length];
  return out;
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateCode(6);
    const [hit] = await db
      .select({ id: quizzesTable.id })
      .from(quizzesTable)
      .where(eq(quizzesTable.code, code))
      .limit(1);
    if (!hit) return code;
  }
  // Vanishingly rare fallback: longer code.
  return generateCode(8);
}

function serializeQuiz(q: typeof quizzesTable.$inferSelect) {
  return {
    id: String(q.id),
    code: q.code,
    title: q.title,
    description: q.description,
    category: q.category,
    difficulty: q.difficulty,
    language: q.language,
    timeLimitSeconds: q.timeLimitSeconds,
    pointsTotal: q.pointsTotal,
    attemptsCount: q.attemptsCount,
    coverUrl: q.coverUrl,
    authorId: q.authorId ?? null,
    authorName: q.authorName,
    isPublic: q.isPublic,
    status: q.status,
    tags: q.tags ?? [],
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  };
}

/** Public-safe question (no `correctAnswer`, no `explanation`). */
function serializeQuestionPublic(q: typeof quizQuestionsTable.$inferSelect) {
  return {
    id: String(q.id),
    quizId: String(q.quizId),
    type: q.type,
    prompt: q.prompt,
    options: q.options ?? [],
    imageUrl: q.imageUrl,
    points: q.points,
    position: q.position,
  };
}

/** Author/admin/result view (includes correctAnswer + explanation). */
function serializeQuestionFull(q: typeof quizQuestionsTable.$inferSelect) {
  return {
    ...serializeQuestionPublic(q),
    correctAnswer: q.correctAnswer ?? null,
    explanation: q.explanation,
  };
}

function serializeAttempt(a: typeof quizAttemptsTable.$inferSelect) {
  return {
    id: String(a.id),
    quizId: String(a.quizId),
    userId: a.userId,
    userName: a.userName,
    score: a.score,
    totalPoints: a.totalPoints,
    correctCount: a.correctCount,
    totalCount: a.totalCount,
    durationMs: a.durationMs,
    status: a.status,
    startedAt: a.startedAt.toISOString(),
    finishedAt: a.finishedAt ? a.finishedAt.toISOString() : null,
  };
}

function serializeAnswer(a: typeof quizAnswersTable.$inferSelect) {
  return {
    id: String(a.id),
    attemptId: String(a.attemptId),
    questionId: String(a.questionId),
    response: a.response ?? null,
    isCorrect: a.isCorrect,
    pointsEarned: a.pointsEarned,
    timeSpentMs: a.timeSpentMs,
    answeredAt: a.answeredAt.toISOString(),
  };
}

function serializeChallenge(c: typeof quizChallengesTable.$inferSelect) {
  return {
    id: String(c.id),
    title: c.title,
    description: c.description,
    type: c.type,
    quizId: String(c.quizId),
    prize: c.prize,
    bannerUrl: c.bannerUrl,
    startsAt: c.startsAt.toISOString(),
    endsAt: c.endsAt.toISOString(),
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

/** Recompute and persist the quiz's pointsTotal cache. */
async function recomputeQuizPoints(quizId: number) {
  const [{ s }] = await db
    .select({ s: sql<number>`coalesce(sum(${quizQuestionsTable.points}),0)::int` })
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, quizId));
  await db
    .update(quizzesTable)
    .set({ pointsTotal: Number(s ?? 0), updatedAt: new Date() })
    .where(eq(quizzesTable.id, quizId));
}

/** Validate a question payload by type, returning normalized `{options, correctAnswer}`. */
function validateQuestion(type: QuestionType, options: unknown, correctAnswer: unknown):
  | { ok: true; options: unknown; correctAnswer: unknown }
  | { ok: false; error: string } {
  switch (type) {
    case "mcq":
    case "multi":
    case "ordering": {
      if (!Array.isArray(options) || options.length < 2) {
        return { ok: false, error: "options must be an array with ≥2 items" };
      }
      const ids = new Set<string>();
      for (const o of options as Array<{ id?: unknown; text?: unknown }>) {
        if (!o || typeof o !== "object") return { ok: false, error: "each option must be an object" };
        const id = String((o as any).id ?? "").trim();
        const text = String((o as any).text ?? "").trim();
        if (!id || !text) return { ok: false, error: "each option needs id and text" };
        if (ids.has(id)) return { ok: false, error: "duplicate option id" };
        ids.add(id);
      }
      if (type === "mcq") {
        if (typeof correctAnswer !== "string" || !ids.has(correctAnswer)) {
          return { ok: false, error: "mcq correctAnswer must be one option id" };
        }
      } else if (type === "multi") {
        if (!Array.isArray(correctAnswer) || correctAnswer.length === 0) {
          return { ok: false, error: "multi correctAnswer must be a non-empty array of ids" };
        }
        for (const id of correctAnswer) if (!ids.has(String(id))) return { ok: false, error: "unknown id in correctAnswer" };
      } else {
        // ordering: must be a permutation
        if (!Array.isArray(correctAnswer) || correctAnswer.length !== ids.size) {
          return { ok: false, error: "ordering correctAnswer length must match options" };
        }
        const seen = new Set<string>();
        for (const id of correctAnswer) {
          const s = String(id);
          if (!ids.has(s) || seen.has(s)) return { ok: false, error: "ordering must be a permutation" };
          seen.add(s);
        }
      }
      return { ok: true, options, correctAnswer };
    }
    case "truefalse": {
      if (correctAnswer !== "true" && correctAnswer !== "false") {
        return { ok: false, error: "truefalse correctAnswer must be 'true' or 'false'" };
      }
      return { ok: true, options: [], correctAnswer };
    }
    case "short": {
      if (typeof correctAnswer !== "string" || !correctAnswer.trim()) {
        return { ok: false, error: "short correctAnswer must be a non-empty string" };
      }
      return { ok: true, options: [], correctAnswer: correctAnswer.trim() };
    }
    case "fill": {
      // options = { blanks: number, hints?: string[] }
      const blanks = Number((options as any)?.blanks ?? 0);
      if (!Number.isInteger(blanks) || blanks <= 0 || blanks > 10) {
        return { ok: false, error: "fill options.blanks must be 1..10" };
      }
      if (!Array.isArray(correctAnswer) || correctAnswer.length !== blanks) {
        return { ok: false, error: "fill correctAnswer must match blanks count" };
      }
      for (const a of correctAnswer) if (typeof a !== "string" || !a.trim()) return { ok: false, error: "blank answers must be non-empty strings" };
      return { ok: true, options: { blanks, hints: Array.isArray((options as any)?.hints) ? (options as any).hints : [] }, correctAnswer };
    }
    default:
      return { ok: false, error: "unknown question type" };
  }
}

/** Score a single response server-side. */
function scoreAnswer(q: typeof quizQuestionsTable.$inferSelect, response: unknown): { isCorrect: boolean; pointsEarned: number } {
  const norm = (s: string) => s.trim().toLowerCase();
  const correct = q.correctAnswer as unknown;
  const points = q.points ?? 0;
  const wrong = { isCorrect: false, pointsEarned: 0 };
  switch (q.type) {
    case "mcq":
      return typeof response === "string" && response === correct
        ? { isCorrect: true, pointsEarned: points }
        : wrong;
    case "multi": {
      if (!Array.isArray(response) || !Array.isArray(correct)) return wrong;
      const a = new Set((response as string[]).map(String));
      const b = new Set((correct as string[]).map(String));
      if (a.size !== b.size) return wrong;
      for (const x of a) if (!b.has(x)) return wrong;
      return { isCorrect: true, pointsEarned: points };
    }
    case "truefalse":
      return typeof response === "string" && response === correct
        ? { isCorrect: true, pointsEarned: points }
        : wrong;
    case "short":
      return typeof response === "string" && typeof correct === "string" && norm(response) === norm(correct)
        ? { isCorrect: true, pointsEarned: points }
        : wrong;
    case "fill": {
      if (!Array.isArray(response) || !Array.isArray(correct) || response.length !== correct.length) return wrong;
      // Partial credit: each correct blank earns its proportional share.
      let hits = 0;
      for (let i = 0; i < correct.length; i++) {
        if (typeof response[i] === "string" && norm(response[i]) === norm(String(correct[i]))) hits++;
      }
      const earned = Math.round((hits / correct.length) * points);
      return { isCorrect: hits === correct.length, pointsEarned: earned };
    }
    case "ordering": {
      if (!Array.isArray(response) || !Array.isArray(correct) || response.length !== correct.length) return wrong;
      for (let i = 0; i < correct.length; i++) {
        if (String(response[i]) !== String(correct[i])) return wrong;
      }
      return { isCorrect: true, pointsEarned: points };
    }
    default:
      return wrong;
  }
}

// ───────────────────────────── QUIZZES — public ─────────────────────────────

router.get("/qa/quizzes", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const difficulty = String(req.query.difficulty ?? "").trim();
  const status = String(req.query.status ?? "published").trim();
  const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);

  const conds = [eq(quizzesTable.isPublic, true)];
  if (status && QUIZ_STATUSES.includes(status as (typeof QUIZ_STATUSES)[number])) {
    conds.push(eq(quizzesTable.status, status));
  }
  if (q) conds.push(or(ilike(quizzesTable.title, `%${q}%`), ilike(quizzesTable.description, `%${q}%`))!);
  if (category) conds.push(eq(quizzesTable.category, category));
  if (difficulty && DIFFICULTIES.includes(difficulty as (typeof DIFFICULTIES)[number])) {
    conds.push(eq(quizzesTable.difficulty, difficulty));
  }

  const rows = await db
    .select()
    .from(quizzesTable)
    .where(and(...conds))
    .orderBy(desc(quizzesTable.createdAt))
    .limit(limit);
  res.json(rows.map(serializeQuiz));
});

function canSeeQuiz(req: any, row: typeof quizzesTable.$inferSelect): boolean {
  if (row.isPublic && row.status === "published") return true;
  if (!req.user) return false;
  return req.user.id === row.authorId || hasRoleAtLeast(req.user, "moderator");
}

router.get("/qa/quizzes/by-code/:code", async (req, res) => {
  const code = String(req.params.code ?? "").trim().toUpperCase();
  if (!code) {
    res.status(400).json({ error: "Code required" });
    return;
  }
  const [row] = await db.select().from(quizzesTable).where(eq(quizzesTable.code, code)).limit(1);
  if (!row || !canSeeQuiz(req, row)) {
    res.status(404).json({ error: "Quiz not found for that code" });
    return;
  }
  res.json(serializeQuiz(row));
});

router.get("/qa/quizzes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, id)).limit(1);
  if (!row || !canSeeQuiz(req, row)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, id))
    .orderBy(asc(quizQuestionsTable.position), asc(quizQuestionsTable.id));

  const isOwnerOrAdmin =
    !!req.user &&
    (req.user.id === row.authorId || hasRoleAtLeast(req.user, "admin"));

  res.json({
    quiz: serializeQuiz(row),
    questions: questions.map(isOwnerOrAdmin ? serializeQuestionFull : serializeQuestionPublic),
  });
});

// ───────────────────────────── QUIZZES — author ─────────────────────────────

router.post("/qa/quizzes", requireRole("moderator"), async (req, res) => {
  const body = req.body ?? {};
  const title = String(body.title ?? "").trim();
  if (!title) {
    res.status(400).json({ error: "title required" });
    return;
  }
  const difficulty = DIFFICULTIES.includes(body.difficulty) ? body.difficulty : "easy";
  const status = QUIZ_STATUSES.includes(body.status) ? body.status : "published";
  const code = await generateUniqueCode();
  const actor = req.user!;

  const [row] = await db
    .insert(quizzesTable)
    .values({
      code,
      title: title.slice(0, 200),
      description: String(body.description ?? "").slice(0, 4000),
      category: String(body.category ?? "general").slice(0, 64),
      difficulty,
      language: String(body.language ?? "en").slice(0, 8),
      timeLimitSeconds: Math.max(0, Math.min(7200, Number(body.timeLimitSeconds ?? 0) || 0)),
      coverUrl: String(body.coverUrl ?? "").slice(0, 1000),
      authorId: actor.id,
      authorName: actor.name || actor.email,
      isPublic: body.isPublic !== false,
      status,
      tags: Array.isArray(body.tags) ? body.tags.map(String).slice(0, 20) : [],
    })
    .returning();
  await recordAudit(req, "qa.quiz.create", "quiz", row!.id, { code: row!.code, title: row!.title });
  res.json(serializeQuiz(row!));
});

async function loadQuizForEdit(req: any, res: any): Promise<typeof quizzesTable.$inferSelect | null> {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return null;
  }
  const [row] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return null;
  }
  const isOwner = req.user?.id === row.authorId;
  const isAdmin = hasRoleAtLeast(req.user, "admin");
  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Only the quiz author or an admin can modify this quiz" });
    return null;
  }
  return row;
}

router.patch("/qa/quizzes/:id", requireRole("moderator"), async (req, res) => {
  const row = await loadQuizForEdit(req, res);
  if (!row) return;
  const body = req.body ?? {};
  const updates: Partial<typeof quizzesTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim().slice(0, 200);
  if (typeof body.description === "string") updates.description = body.description.slice(0, 4000);
  if (typeof body.category === "string") updates.category = body.category.slice(0, 64);
  if (typeof body.difficulty === "string" && DIFFICULTIES.includes(body.difficulty)) updates.difficulty = body.difficulty;
  if (typeof body.language === "string") updates.language = body.language.slice(0, 8);
  if (Number.isFinite(body.timeLimitSeconds)) updates.timeLimitSeconds = Math.max(0, Math.min(7200, body.timeLimitSeconds));
  if (typeof body.coverUrl === "string") updates.coverUrl = body.coverUrl.slice(0, 1000);
  if (typeof body.isPublic === "boolean") updates.isPublic = body.isPublic;
  if (typeof body.status === "string" && QUIZ_STATUSES.includes(body.status)) updates.status = body.status;
  if (Array.isArray(body.tags)) updates.tags = body.tags.map(String).slice(0, 20);

  const [updated] = await db.update(quizzesTable).set(updates).where(eq(quizzesTable.id, row.id)).returning();
  await recordAudit(req, "qa.quiz.update", "quiz", row.id, { fields: Object.keys(updates) });
  res.json(serializeQuiz(updated!));
});

router.delete("/qa/quizzes/:id", requireRole("moderator"), async (req, res) => {
  const row = await loadQuizForEdit(req, res);
  if (!row) return;
  // Cascade in app code (no FKs declared yet).
  const qIds = await db
    .select({ id: quizQuestionsTable.id })
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, row.id));
  const aIds = await db
    .select({ id: quizAttemptsTable.id })
    .from(quizAttemptsTable)
    .where(eq(quizAttemptsTable.quizId, row.id));
  if (aIds.length) {
    await db
      .delete(quizAnswersTable)
      .where(inArray(quizAnswersTable.attemptId, aIds.map((x) => x.id)));
    await db.delete(quizAttemptsTable).where(eq(quizAttemptsTable.quizId, row.id));
  }
  if (qIds.length) {
    await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, row.id));
  }
  await db.delete(quizChallengesTable).where(eq(quizChallengesTable.quizId, row.id));
  await db.delete(quizzesTable).where(eq(quizzesTable.id, row.id));
  await recordAudit(req, "qa.quiz.delete", "quiz", row.id, { code: row.code });
  res.json({ ok: true });
});

// ───────────────────────────── QUESTIONS ─────────────────────────────

router.post("/qa/quizzes/:id/questions", requireRole("moderator"), async (req, res) => {
  const quiz = await loadQuizForEdit(req, res);
  if (!quiz) return;
  const body = req.body ?? {};
  const type = body.type as QuestionType;
  if (!QUESTION_TYPES.includes(type)) {
    res.status(400).json({ error: "Invalid question type" });
    return;
  }
  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) {
    res.status(400).json({ error: "prompt required" });
    return;
  }
  const v = validateQuestion(type, body.options, body.correctAnswer);
  if (!v.ok) {
    res.status(400).json({ error: v.error });
    return;
  }
  const points = Math.max(1, Math.min(1000, Number(body.points ?? 10) || 10));
  // Position: append to end if not provided
  let position = Number(body.position);
  if (!Number.isFinite(position)) {
    const [{ p }] = await db
      .select({ p: sql<number>`coalesce(max(${quizQuestionsTable.position}),-1)::int` })
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quizId, quiz.id));
    position = Number(p ?? -1) + 1;
  }
  const [row] = await db
    .insert(quizQuestionsTable)
    .values({
      quizId: quiz.id,
      type,
      prompt: prompt.slice(0, 4000),
      options: v.options as any,
      correctAnswer: v.correctAnswer as any,
      explanation: String(body.explanation ?? "").slice(0, 4000),
      imageUrl: String(body.imageUrl ?? "").slice(0, 1000),
      points,
      position,
    })
    .returning();
  await recomputeQuizPoints(quiz.id);
  await recordAudit(req, "qa.question.create", "question", row!.id, {
    quizId: quiz.id,
    type: row!.type,
  });
  res.json(serializeQuestionFull(row!));
});

router.patch("/qa/questions/:id", requireRole("moderator"), async (req, res) => {
  const id = Number(req.params.id);
  const [q] = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.id, id)).limit(1);
  if (!q) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, q.quizId)).limit(1);
  if (!quiz) {
    res.status(404).json({ error: "Parent quiz not found" });
    return;
  }
  const isOwner = req.user?.id === quiz.authorId;
  if (!isOwner && !hasRoleAtLeast(req.user, "admin")) {
    res.status(403).json({ error: "Only the quiz author or an admin can modify questions" });
    return;
  }

  const body = req.body ?? {};
  const updates: Partial<typeof quizQuestionsTable.$inferInsert> = {};
  const newType = (body.type as QuestionType) ?? (q.type as QuestionType);
  if (body.type && !QUESTION_TYPES.includes(body.type)) {
    res.status(400).json({ error: "Invalid type" });
    return;
  }
  if (body.options !== undefined || body.correctAnswer !== undefined || body.type !== undefined) {
    const v = validateQuestion(
      newType,
      body.options !== undefined ? body.options : q.options,
      body.correctAnswer !== undefined ? body.correctAnswer : q.correctAnswer,
    );
    if (!v.ok) {
      res.status(400).json({ error: v.error });
      return;
    }
    updates.type = newType;
    updates.options = v.options as any;
    updates.correctAnswer = v.correctAnswer as any;
  }
  if (typeof body.prompt === "string" && body.prompt.trim()) updates.prompt = body.prompt.trim().slice(0, 4000);
  if (typeof body.explanation === "string") updates.explanation = body.explanation.slice(0, 4000);
  if (typeof body.imageUrl === "string") updates.imageUrl = body.imageUrl.slice(0, 1000);
  if (Number.isFinite(body.points)) updates.points = Math.max(1, Math.min(1000, body.points));
  if (Number.isFinite(body.position)) updates.position = body.position;

  const [updated] = await db.update(quizQuestionsTable).set(updates).where(eq(quizQuestionsTable.id, id)).returning();
  await recomputeQuizPoints(quiz.id);
  await recordAudit(req, "qa.question.update", "question", id, {
    quizId: quiz.id,
    fields: Object.keys(updates),
  });
  res.json(serializeQuestionFull(updated!));
});

router.delete("/qa/questions/:id", requireRole("moderator"), async (req, res) => {
  const id = Number(req.params.id);
  const [q] = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.id, id)).limit(1);
  if (!q) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, q.quizId)).limit(1);
  if (!quiz) {
    res.status(404).json({ error: "Parent quiz not found" });
    return;
  }
  if (req.user?.id !== quiz.authorId && !hasRoleAtLeast(req.user, "admin")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.id, id));
  await recomputeQuizPoints(quiz.id);
  await recordAudit(req, "qa.question.delete", "question", id, { quizId: quiz.id });
  res.json({ ok: true });
});

// ───────────────────────────── ATTEMPTS ─────────────────────────────

router.post("/qa/quizzes/:id/start", requireAuth, async (req, res) => {
  const quizId = Number(req.params.id);
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId)).limit(1);
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  if (quiz.status !== "published") {
    res.status(400).json({ error: "Quiz is not playable right now" });
    return;
  }
  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, quizId))
    .orderBy(asc(quizQuestionsTable.position), asc(quizQuestionsTable.id));
  if (questions.length === 0) {
    res.status(400).json({ error: "Quiz has no questions yet" });
    return;
  }
  const actor = req.user!;
  const totalPoints = questions.reduce((s, q) => s + (q.points ?? 0), 0);
  const [attempt] = await db
    .insert(quizAttemptsTable)
    .values({
      quizId,
      userId: actor.id,
      userName: actor.name || actor.email,
      totalPoints,
      totalCount: questions.length,
      status: "in_progress",
    })
    .returning();
  res.json({
    attempt: serializeAttempt(attempt!),
    quiz: serializeQuiz(quiz),
    questions: questions.map(serializeQuestionPublic),
  });
});

router.post("/qa/attempts/:id/answer", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body ?? {};
  const questionId = Number(body.questionId);

  // Single transaction with status revalidation to prevent races with /finish.
  const result = await db.transaction(async (tx) => {
    const [attempt] = await tx
      .select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, id))
      .limit(1);
    if (!attempt) return { http: 404, body: { error: "Attempt not found" } };
    if (attempt.userId !== req.user!.id)
      return { http: 403, body: { error: "Not your attempt" } };
    if (attempt.status !== "in_progress")
      return { http: 400, body: { error: "Attempt is finished" } };

    const [question] = await tx
      .select()
      .from(quizQuestionsTable)
      .where(and(eq(quizQuestionsTable.id, questionId), eq(quizQuestionsTable.quizId, attempt.quizId)))
      .limit(1);
    if (!question) return { http: 400, body: { error: "Question does not belong to this quiz" } };

    const { isCorrect, pointsEarned } = scoreAnswer(question, body.response);
    const timeSpentMs = Math.max(0, Math.min(60 * 60 * 1000, Number(body.timeSpentMs ?? 0)));

    // Atomic upsert via DB unique constraint on (attempt_id, question_id).
    const [saved] = await tx
      .insert(quizAnswersTable)
      .values({
        attemptId: attempt.id,
        questionId: question.id,
        response: body.response ?? null,
        isCorrect,
        pointsEarned,
        timeSpentMs,
      })
      .onConflictDoUpdate({
        target: [quizAnswersTable.attemptId, quizAnswersTable.questionId],
        set: {
          response: body.response ?? null,
          isCorrect,
          pointsEarned,
          timeSpentMs,
          answeredAt: new Date(),
        },
      })
      .returning();

    const [{ s, c }] = await tx
      .select({
        s: sql<number>`coalesce(sum(${quizAnswersTable.pointsEarned}),0)::int`,
        c: sql<number>`coalesce(sum(case when ${quizAnswersTable.isCorrect} then 1 else 0 end),0)::int`,
      })
      .from(quizAnswersTable)
      .where(eq(quizAnswersTable.attemptId, attempt.id));

    // Only update score if attempt is still in_progress (defends against a finish racing in).
    await tx
      .update(quizAttemptsTable)
      .set({ score: Number(s ?? 0), correctCount: Number(c ?? 0) })
      .where(and(eq(quizAttemptsTable.id, attempt.id), eq(quizAttemptsTable.status, "in_progress")));

    return {
      http: 200,
      body: {
        answer: serializeAnswer(saved!),
        correctAnswer: question.correctAnswer ?? null,
        explanation: question.explanation,
        score: Number(s ?? 0),
        correctCount: Number(c ?? 0),
      },
    };
  });
  res.status(result.http).json(result.body);
});

router.post("/qa/attempts/:id/finish", requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  const result = await db.transaction(async (tx) => {
    const [attempt] = await tx
      .select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, id))
      .limit(1);
    if (!attempt) return { http: 404, body: { error: "Attempt not found" } as any };
    if (attempt.userId !== req.user!.id)
      return { http: 403, body: { error: "Not your attempt" } as any };
    if (attempt.status !== "in_progress") {
      return { http: 200, body: serializeAttempt(attempt) as any };
    }
    const finishedAt = new Date();
    const durationMs = Math.max(0, finishedAt.getTime() - attempt.startedAt.getTime());

    // Conditional update — only one concurrent finisher will get a row back.
    const updates = await tx
      .update(quizAttemptsTable)
      .set({ status: "completed", finishedAt, durationMs })
      .where(and(eq(quizAttemptsTable.id, id), eq(quizAttemptsTable.status, "in_progress")))
      .returning();

    if (updates.length === 0) {
      const [latest] = await tx.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.id, id)).limit(1);
      return { http: 200, body: serializeAttempt(latest!) as any };
    }
    // Only the winning transaction increments attemptsCount.
    await tx
      .update(quizzesTable)
      .set({ attemptsCount: sql`${quizzesTable.attemptsCount} + 1` })
      .where(eq(quizzesTable.id, attempt.quizId));
    return { http: 200, body: serializeAttempt(updates[0]!) as any };
  });
  res.status(result.http).json(result.body);
});

router.get("/qa/attempts/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [attempt] = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.id, id)).limit(1);
  if (!attempt) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (attempt.userId !== req.user!.id && !hasRoleAtLeast(req.user, "admin")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, attempt.quizId)).limit(1);
  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, attempt.quizId))
    .orderBy(asc(quizQuestionsTable.position), asc(quizQuestionsTable.id));
  const answers = await db
    .select()
    .from(quizAnswersTable)
    .where(eq(quizAnswersTable.attemptId, attempt.id));

  // Critical: never reveal correct answers / explanations / per-answer correctness
  // to the *player* while their attempt is still in progress, even if they are an
  // admin (otherwise an admin playing for fun could just open devtools and cheat).
  // An admin reviewing *someone else's* attempt is allowed full reveal at any time.
  const isOwnAttempt = attempt.userId === req.user!.id;
  const isReviewer =
    attempt.status !== "in_progress" ||
    (!isOwnAttempt && hasRoleAtLeast(req.user, "admin"));

  const safeAnswers = answers.map((a) =>
    isReviewer
      ? serializeAnswer(a)
      : {
          ...serializeAnswer(a),
          isCorrect: false,
          pointsEarned: 0,
        },
  );

  res.json({
    attempt: serializeAttempt(attempt),
    quiz: quiz ? serializeQuiz(quiz) : null,
    questions: questions.map(isReviewer ? serializeQuestionFull : serializeQuestionPublic),
    answers: safeAnswers,
  });
});

router.get("/qa/me/attempts", requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);
  const rows = await db
    .select()
    .from(quizAttemptsTable)
    .where(eq(quizAttemptsTable.userId, req.user!.id))
    .orderBy(desc(quizAttemptsTable.startedAt))
    .limit(limit);
  res.json(rows.map(serializeAttempt));
});

// ───────────────────────────── LEADERBOARD ─────────────────────────────

router.get("/qa/leaderboard", async (req, res) => {
  const window = String(req.query.window ?? "all");
  const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);
  const conds = [eq(quizAttemptsTable.status, "completed")];
  const now = Date.now();
  if (window === "week") {
    conds.push(gte(quizAttemptsTable.finishedAt, new Date(now - 7 * 24 * 3600 * 1000)));
  } else if (window === "month") {
    conds.push(gte(quizAttemptsTable.finishedAt, new Date(now - 30 * 24 * 3600 * 1000)));
  } else if (window === "today") {
    conds.push(gte(quizAttemptsTable.finishedAt, new Date(now - 24 * 3600 * 1000)));
  }

  const rows = await db
    .select({
      userId: quizAttemptsTable.userId,
      userName: quizAttemptsTable.userName,
      points: sql<number>`coalesce(sum(${quizAttemptsTable.score}),0)::int`.as("points"),
      attempts: sql<number>`count(*)::int`.as("attempts"),
      bestScore: sql<number>`coalesce(max(${quizAttemptsTable.score}),0)::int`.as("best_score"),
      correctCount: sql<number>`coalesce(sum(${quizAttemptsTable.correctCount}),0)::int`.as("correct_count_sum"),
      totalCount: sql<number>`coalesce(sum(${quizAttemptsTable.totalCount}),0)::int`.as("total_count_sum"),
    })
    .from(quizAttemptsTable)
    .where(and(...conds))
    .groupBy(quizAttemptsTable.userId, quizAttemptsTable.userName)
    .orderBy(desc(sql`coalesce(sum(${quizAttemptsTable.score}),0)`))
    .limit(limit);

  res.json({
    window,
    entries: rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      userName: r.userName,
      points: Number(r.points ?? 0),
      attempts: Number(r.attempts ?? 0),
      bestScore: Number(r.bestScore ?? 0),
      accuracy:
        Number(r.totalCount ?? 0) > 0
          ? Math.round((Number(r.correctCount ?? 0) / Number(r.totalCount ?? 0)) * 100)
          : 0,
    })),
  });
});

// ───────────────────────────── CHALLENGES ─────────────────────────────

router.get("/qa/challenges", async (_req, res) => {
  const now = new Date();
  const rows = await db
    .select()
    .from(quizChallengesTable)
    .where(and(lte(quizChallengesTable.startsAt, now), gte(quizChallengesTable.endsAt, now)))
    .orderBy(asc(quizChallengesTable.endsAt));
  res.json(rows.map(serializeChallenge));
});

router.post("/qa/challenges", requireRole("admin"), async (req, res) => {
  const body = req.body ?? {};
  const quizId = Number(body.quizId);
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId)).limit(1);
  if (!quiz) {
    res.status(400).json({ error: "Invalid quizId" });
    return;
  }
  const type = CHALLENGE_TYPES.includes(body.type) ? body.type : "weekly";
  const now = new Date();
  let endsAt = body.endsAt ? new Date(body.endsAt) : null;
  if (!endsAt || Number.isNaN(endsAt.getTime())) {
    const days = type === "monthly" ? 30 : type === "flash" ? 1 : 7;
    endsAt = new Date(now.getTime() + days * 24 * 3600 * 1000);
  }
  const startsAt = body.startsAt ? new Date(body.startsAt) : now;
  if (Number.isNaN(startsAt.getTime())) {
    res.status(400).json({ error: "Invalid startsAt" });
    return;
  }
  const [row] = await db
    .insert(quizChallengesTable)
    .values({
      title: String(body.title ?? quiz.title).slice(0, 200),
      description: String(body.description ?? "").slice(0, 4000),
      type,
      quizId,
      prize: String(body.prize ?? "").slice(0, 200),
      bannerUrl: String(body.bannerUrl ?? "").slice(0, 1000),
      startsAt,
      endsAt,
      status: "active",
    })
    .returning();
  await recordAudit(req, "qa.challenge.create", "challenge", row!.id, { quizId, type });
  res.json(serializeChallenge(row!));
});

router.patch("/qa/challenges/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body ?? {};
  const updates: Partial<typeof quizChallengesTable.$inferInsert> = {};
  if (typeof body.title === "string") updates.title = body.title.slice(0, 200);
  if (typeof body.description === "string") updates.description = body.description.slice(0, 4000);
  if (typeof body.type === "string" && CHALLENGE_TYPES.includes(body.type)) updates.type = body.type;
  if (typeof body.prize === "string") updates.prize = body.prize.slice(0, 200);
  if (typeof body.bannerUrl === "string") updates.bannerUrl = body.bannerUrl.slice(0, 1000);
  if (typeof body.status === "string") updates.status = body.status.slice(0, 16);
  if (body.startsAt) updates.startsAt = new Date(body.startsAt);
  if (body.endsAt) updates.endsAt = new Date(body.endsAt);
  const [row] = await db.update(quizChallengesTable).set(updates).where(eq(quizChallengesTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await recordAudit(req, "qa.challenge.update", "challenge", id, { fields: Object.keys(updates) });
  res.json(serializeChallenge(row));
});

router.delete("/qa/challenges/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(quizChallengesTable).where(eq(quizChallengesTable.id, id));
  await recordAudit(req, "qa.challenge.delete", "challenge", id, {});
  res.json({ ok: true });
});

export default router;
