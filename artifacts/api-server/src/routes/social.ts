/**
 * Social / Engagement routes:
 *   - /users/me           GET, PATCH  -- private profile + edit
 *   - /users/:id          GET         -- public profile view
 *   - /me/bookmarks       GET, POST, DELETE
 *   - /me/badges          GET
 *   - /me/streak          GET
 *   - /me/notifications   GET
 *   - /me/notifications/read-all   POST
 *   - /comments           GET, POST
 *   - /comments/:id       PATCH, DELETE
 *   - /comments/:id/like  POST, DELETE
 *   - /comments/:id/report POST
 *   - /reactions          GET, POST, DELETE
 */

import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  bookmarksTable,
  badgesTable,
  userBadgesTable,
  commentsTable,
  commentLikesTable,
  reactionsTable,
  notificationsTable,
  quizAttemptsTable,
  TARGET_TYPES,
  REACTION_KINDS,
  type Comment,
  type User,
} from "@workspace/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { requireAuth, hasRoleAtLeast } from "../lib/auth";
import { recordAudit } from "../lib/audit";
import { getStreak, bumpStreak } from "../lib/streak";
import {
  evaluateStreakBadges,
  evaluateBookmarkBadges,
  evaluateCommentBadges,
} from "../lib/badges";
import { notify } from "../lib/notifications";

const router: IRouter = Router();

// ───────────────────────── helpers ─────────────────────────

function isTargetType(v: unknown): v is (typeof TARGET_TYPES)[number] {
  return typeof v === "string" && (TARGET_TYPES as readonly string[]).includes(v);
}
function isReactionKind(v: unknown): v is (typeof REACTION_KINDS)[number] {
  return typeof v === "string" && (REACTION_KINDS as readonly string[]).includes(v);
}

function publicAvatar(u: User): string {
  return u.avatarUrl || "";
}
function displayName(u: User): string {
  return u.displayName?.trim() ? u.displayName : u.name;
}

function serializeNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: String(n.id),
    kind: n.kind,
    title: n.title,
    body: n.body,
    link: n.link,
    metadata: n.metadata as Record<string, unknown>,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

function serializeBookmark(b: typeof bookmarksTable.$inferSelect) {
  return {
    id: String(b.id),
    targetType: b.targetType,
    targetId: b.targetId,
    createdAt: b.createdAt.toISOString(),
  };
}

function serializeBadge(
  row: typeof badgesTable.$inferSelect,
  awardedAt?: Date,
) {
  return {
    id: String(row.id),
    key: row.key,
    name: row.name,
    description: row.description,
    iconKey: row.iconKey,
    tier: row.tier,
    sortOrder: row.sortOrder,
    awardedAt: awardedAt ? awardedAt.toISOString() : null,
  };
}

function serializeComment(c: Comment) {
  return {
    id: String(c.id),
    userId: String(c.userId),
    userName: c.userName,
    userAvatarUrl: c.userAvatarUrl,
    targetType: c.targetType,
    targetId: c.targetId,
    parentId: c.parentId == null ? null : String(c.parentId),
    body: c.body,
    likesCount: c.likesCount,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// ───────────────────────── /users/me ─────────────────────────

router.get("/users/me", requireAuth, async (req, res) => {
  const u = req.user!;
  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, u.id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const streak = await getStreak(u.id);

  const [badgesAgg] = await db
    .select({ n: sql<number>`count(*)` })
    .from(userBadgesTable)
    .where(eq(userBadgesTable.userId, u.id));

  const [attemptsAgg] = await db
    .select({ n: sql<number>`count(*)` })
    .from(quizAttemptsTable)
    .where(
      and(
        eq(quizAttemptsTable.userId, u.id),
        eq(quizAttemptsTable.status, "completed"),
      ),
    );

  const [bookmarkAgg] = await db
    .select({ n: sql<number>`count(*)` })
    .from(bookmarksTable)
    .where(eq(bookmarksTable.userId, u.id));

  res.json({
    id: String(row.id),
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    displayName: row.displayName ?? "",
    avatarUrl: row.avatarUrl ?? "",
    bio: row.bio ?? "",
    isPublic: row.isPublic,
    createdAt: row.createdAt.toISOString(),
    stats: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalPoints: streak.totalPoints,
      lastActiveDate: streak.lastActiveDate,
      quizzesCompleted: Number(attemptsAgg?.n ?? 0),
      badgesEarned: Number(badgesAgg?.n ?? 0),
      bookmarksCount: Number(bookmarkAgg?.n ?? 0),
    },
  });
});

router.patch("/users/me", requireAuth, async (req, res) => {
  const u = req.user!;
  const body = req.body ?? {};
  const update: Partial<{
    displayName: string;
    avatarUrl: string;
    bio: string;
    isPublic: boolean;
  }> = {};
  if (typeof body.displayName === "string") {
    update.displayName = body.displayName.trim().slice(0, 255);
  }
  if (typeof body.avatarUrl === "string") {
    update.avatarUrl = body.avatarUrl.trim().slice(0, 2000);
  }
  if (typeof body.bio === "string") {
    update.bio = body.bio.trim().slice(0, 1000);
  }
  if (typeof body.isPublic === "boolean") {
    update.isPublic = body.isPublic;
  }
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "No updatable fields supplied" });
    return;
  }
  const [row] = await db
    .update(usersTable)
    .set(update)
    .where(eq(usersTable.id, u.id))
    .returning();
  await bumpStreak(u.id, 0);
  res.json({
    id: String(row.id),
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    displayName: row.displayName ?? "",
    avatarUrl: row.avatarUrl ?? "",
    bio: row.bio ?? "",
    isPublic: row.isPublic,
    createdAt: row.createdAt.toISOString(),
  });
});

// ───────────────────────── /users/:id (public) ─────────────────────────

router.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!row.isPublic && (!req.user || req.user.id !== row.id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const streak = await getStreak(row.id);

  const badgeRows = await db
    .select({
      id: badgesTable.id,
      key: badgesTable.key,
      name: badgesTable.name,
      description: badgesTable.description,
      iconKey: badgesTable.iconKey,
      tier: badgesTable.tier,
      sortOrder: badgesTable.sortOrder,
      awardedAt: userBadgesTable.awardedAt,
    })
    .from(userBadgesTable)
    .innerJoin(badgesTable, eq(badgesTable.id, userBadgesTable.badgeId))
    .where(eq(userBadgesTable.userId, row.id))
    .orderBy(desc(userBadgesTable.awardedAt));

  res.json({
    id: String(row.id),
    name: displayName(row),
    avatarUrl: publicAvatar(row),
    bio: row.bio ?? "",
    role: row.role,
    isPublic: row.isPublic,
    createdAt: row.createdAt.toISOString(),
    stats: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalPoints: streak.totalPoints,
    },
    badges: badgeRows.map((b: any) =>
      serializeBadge(b as any, b.awardedAt as Date),
    ),
  });
});

// ───────────────────────── /me/bookmarks ─────────────────────────

router.get("/me/bookmarks", requireAuth, async (req, res) => {
  const u = req.user!;
  const targetType = req.query.targetType;
  const conds = [eq(bookmarksTable.userId, u.id)];
  if (typeof targetType === "string" && targetType) {
    if (!isTargetType(targetType)) {
      res.status(400).json({ error: "Invalid targetType" });
      return;
    }
    conds.push(eq(bookmarksTable.targetType, targetType));
  }
  const rows = await db
    .select()
    .from(bookmarksTable)
    .where(and(...conds))
    .orderBy(desc(bookmarksTable.createdAt));
  res.json(rows.map(serializeBookmark));
});

router.post("/me/bookmarks", requireAuth, async (req, res) => {
  const u = req.user!;
  const { targetType, targetId } = req.body ?? {};
  if (!isTargetType(targetType) || typeof targetId !== "string" || !targetId) {
    res.status(400).json({ error: "targetType and targetId required" });
    return;
  }
  const [row] = await db
    .insert(bookmarksTable)
    .values({ userId: u.id, targetType, targetId: String(targetId).slice(0, 64) })
    .onConflictDoUpdate({
      target: [
        bookmarksTable.userId,
        bookmarksTable.targetType,
        bookmarksTable.targetId,
      ],
      set: { createdAt: sql`${bookmarksTable.createdAt}` }, // no-op
    })
    .returning();

  await bumpStreak(u.id, 0).then(({ state, bumped }) => {
    if (bumped) evaluateStreakBadges(u.id, state.currentStreak);
  });
  await evaluateBookmarkBadges(u.id, targetType);

  res.json(serializeBookmark(row!));
});

router.delete("/me/bookmarks", requireAuth, async (req, res) => {
  const u = req.user!;
  const { targetType, targetId } = req.body ?? req.query;
  if (!isTargetType(targetType) || typeof targetId !== "string" || !targetId) {
    res.status(400).json({ error: "targetType and targetId required" });
    return;
  }
  await db
    .delete(bookmarksTable)
    .where(
      and(
        eq(bookmarksTable.userId, u.id),
        eq(bookmarksTable.targetType, targetType),
        eq(bookmarksTable.targetId, String(targetId)),
      ),
    );
  res.json({ ok: true });
});

// ───────────────────────── /me/badges ─────────────────────────

router.get("/me/badges", requireAuth, async (req, res) => {
  const u = req.user!;
  const rows = await db
    .select({
      id: badgesTable.id,
      key: badgesTable.key,
      name: badgesTable.name,
      description: badgesTable.description,
      iconKey: badgesTable.iconKey,
      tier: badgesTable.tier,
      sortOrder: badgesTable.sortOrder,
      awardedAt: userBadgesTable.awardedAt,
    })
    .from(userBadgesTable)
    .innerJoin(badgesTable, eq(badgesTable.id, userBadgesTable.badgeId))
    .where(eq(userBadgesTable.userId, u.id))
    .orderBy(desc(userBadgesTable.awardedAt));
  res.json(
    rows.map((b: any) => serializeBadge(b as any, b.awardedAt as Date)),
  );
});

// ───────────────────────── /me/streak ─────────────────────────

router.get("/me/streak", requireAuth, async (req, res) => {
  const u = req.user!;
  const s = await getStreak(u.id);
  res.json({
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
    totalPoints: s.totalPoints,
    lastActiveDate: s.lastActiveDate,
  });
});

// ───────────────────────── /me/notifications ─────────────────────────

router.get("/me/notifications", requireAuth, async (req, res) => {
  const u = req.user!;
  const unreadOnly = req.query.unread === "true";
  const conds = [eq(notificationsTable.userId, u.id)];
  if (unreadOnly) conds.push(eq(notificationsTable.isRead, false));
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(and(...conds))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);
  const [unreadCountRow] = await db
    .select({ n: sql<number>`count(*)` })
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, u.id),
        eq(notificationsTable.isRead, false),
      ),
    );
  res.json({
    items: rows.map(serializeNotification),
    unreadCount: Number(unreadCountRow?.n ?? 0),
  });
});

router.post("/me/notifications/read-all", requireAuth, async (req, res) => {
  const u = req.user!;
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.userId, u.id),
        eq(notificationsTable.isRead, false),
      ),
    );
  res.json({ ok: true });
});

router.post(
  "/me/notifications/:id/read",
  requireAuth,
  async (req, res) => {
    const u = req.user!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationsTable.id, id),
          eq(notificationsTable.userId, u.id),
        ),
      );
    res.json({ ok: true });
  },
);

// ───────────────────────── /comments ─────────────────────────

const COMMENT_RATE_LIMIT_PER_MIN = 12;
const recentCommentsByUser = new Map<number, number[]>();
function checkCommentRate(userId: number): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const arr = (recentCommentsByUser.get(userId) ?? []).filter(
    (t) => t >= windowStart,
  );
  if (arr.length >= COMMENT_RATE_LIMIT_PER_MIN) return false;
  arr.push(now);
  recentCommentsByUser.set(userId, arr);
  return true;
}

router.get("/comments", async (req, res) => {
  const targetType = req.query.targetType;
  const targetId = req.query.targetId;
  if (
    !isTargetType(targetType) ||
    typeof targetId !== "string" ||
    !targetId
  ) {
    res.status(400).json({ error: "targetType and targetId required" });
    return;
  }
  const rows = await db
    .select()
    .from(commentsTable)
    .where(
      and(
        eq(commentsTable.targetType, targetType),
        eq(commentsTable.targetId, String(targetId)),
        eq(commentsTable.status, "visible"),
      ),
    )
    .orderBy(asc(commentsTable.createdAt))
    .limit(500);
  res.json(rows.map(serializeComment));
});

router.post("/comments", requireAuth, async (req, res) => {
  const u = req.user!;
  if (!checkCommentRate(u.id)) {
    res.status(429).json({ error: "Too many comments — please wait a moment" });
    return;
  }
  const { targetType, targetId, parentId, body } = req.body ?? {};
  if (
    !isTargetType(targetType) ||
    typeof targetId !== "string" ||
    !targetId ||
    typeof body !== "string" ||
    !body.trim()
  ) {
    res.status(400).json({ error: "Invalid comment" });
    return;
  }
  const trimmed = body.trim().slice(0, 2000);

  const [me] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, u.id))
    .limit(1);
  const userName = me ? displayName(me) : u.name;
  const userAvatarUrl = me ? publicAvatar(me) : "";

  let parent: typeof commentsTable.$inferSelect | undefined;
  if (parentId != null) {
    const pid = Number(parentId);
    if (!Number.isFinite(pid)) {
      res.status(400).json({ error: "Invalid parentId" });
      return;
    }
    const [p] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, pid))
      .limit(1);
    if (!p) {
      res.status(404).json({ error: "Parent not found" });
      return;
    }
    if (p.parentId != null) {
      // Enforce 1-level threading.
      res.status(400).json({ error: "Replies cannot be nested" });
      return;
    }
    if (p.targetType !== targetType || p.targetId !== String(targetId)) {
      res.status(400).json({ error: "Parent target mismatch" });
      return;
    }
    parent = p;
  }

  const [row] = await db
    .insert(commentsTable)
    .values({
      userId: u.id,
      userName,
      userAvatarUrl,
      targetType,
      targetId: String(targetId),
      parentId: parent ? parent.id : null,
      body: trimmed,
    })
    .returning();

  // Streak + first-comment badge
  await bumpStreak(u.id, 0).then(({ state, bumped }) => {
    if (bumped) evaluateStreakBadges(u.id, state.currentStreak);
  });
  await evaluateCommentBadges(u.id);

  // Notify the parent author about the reply.
  if (parent && parent.userId !== u.id) {
    await notify(
      parent.userId,
      "comment_reply",
      `${userName} replied to your comment`,
      trimmed.slice(0, 140),
      `/${targetType === "news" ? "news" : "learn/quizzes"}/${targetId}#comment-${row!.id}`,
      { commentId: row!.id, parentId: parent.id, targetType, targetId },
    );
  }

  res.json(serializeComment(row!));
});

router.patch("/comments/:id", requireAuth, async (req, res) => {
  const u = req.user!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { body } = req.body ?? {};
  if (typeof body !== "string" || !body.trim()) {
    res.status(400).json({ error: "Body required" });
    return;
  }
  const [c] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, id))
    .limit(1);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const isOwner = c.userId === u.id;
  const isMod = hasRoleAtLeast(u, "moderator");
  if (!isOwner && !isMod) {
    res.status(403).json({ error: "Not allowed" });
    return;
  }
  const [updated] = await db
    .update(commentsTable)
    .set({ body: body.trim().slice(0, 2000), updatedAt: sql`now()` })
    .where(eq(commentsTable.id, id))
    .returning();
  if (isMod && !isOwner) {
    await recordAudit(req, "comment.edit", "comment", id, {
      targetType: c.targetType,
      targetId: c.targetId,
    });
  }
  res.json(serializeComment(updated!));
});

router.delete("/comments/:id", requireAuth, async (req, res) => {
  const u = req.user!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [c] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, id))
    .limit(1);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const isOwner = c.userId === u.id;
  const isMod = hasRoleAtLeast(u, "moderator");
  if (!isOwner && !isMod) {
    res.status(403).json({ error: "Not allowed" });
    return;
  }
  await db
    .update(commentsTable)
    .set({ status: "deleted", body: "" })
    .where(eq(commentsTable.id, id));
  if (isMod && !isOwner) {
    await recordAudit(req, "comment.delete", "comment", id, {
      targetType: c.targetType,
      targetId: c.targetId,
    });
  }
  res.json({ ok: true });
});

router.post("/comments/:id/like", requireAuth, async (req, res) => {
  const u = req.user!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [c] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, id))
    .limit(1);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const inserted = await db
    .insert(commentLikesTable)
    .values({ commentId: id, userId: u.id })
    .onConflictDoNothing()
    .returning();
  if (inserted.length > 0) {
    await db
      .update(commentsTable)
      .set({ likesCount: sql`${commentsTable.likesCount} + 1` })
      .where(eq(commentsTable.id, id));
    if (c.userId !== u.id) {
      await notify(
        c.userId,
        "comment_liked",
        "Someone liked your comment",
        c.body.slice(0, 140),
        `/${c.targetType === "news" ? "news" : "learn/quizzes"}/${c.targetId}#comment-${c.id}`,
        { commentId: c.id },
      );
    }
  }
  res.json({ ok: true });
});

router.delete("/comments/:id/like", requireAuth, async (req, res) => {
  const u = req.user!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = await db
    .delete(commentLikesTable)
    .where(
      and(
        eq(commentLikesTable.commentId, id),
        eq(commentLikesTable.userId, u.id),
      ),
    )
    .returning();
  if (deleted.length > 0) {
    await db
      .update(commentsTable)
      .set({
        likesCount: sql`GREATEST(${commentsTable.likesCount} - 1, 0)`,
      })
      .where(eq(commentsTable.id, id));
  }
  res.json({ ok: true });
});

router.post("/comments/:id/report", requireAuth, async (req, res) => {
  const u = req.user!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const reason =
    typeof req.body?.reason === "string" ? req.body.reason.slice(0, 280) : "";
  const [c] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, id))
    .limit(1);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db
    .update(commentsTable)
    .set({ reportsCount: sql`${commentsTable.reportsCount} + 1` })
    .where(eq(commentsTable.id, id));
  await recordAudit(req, "comment.report", "comment", id, {
    reporterId: u.id,
    reason,
    targetType: c.targetType,
    targetId: c.targetId,
  });
  res.json({ ok: true });
});

// ───────────────────────── /reactions ─────────────────────────

router.get("/reactions", async (req, res) => {
  const targetType = req.query.targetType;
  const targetId = req.query.targetId;
  if (
    !isTargetType(targetType) ||
    typeof targetId !== "string" ||
    !targetId
  ) {
    res.status(400).json({ error: "targetType and targetId required" });
    return;
  }

  // Aggregate counts per kind.
  const rows = await db
    .select({
      kind: reactionsTable.kind,
      n: sql<number>`count(*)`,
    })
    .from(reactionsTable)
    .where(
      and(
        eq(reactionsTable.targetType, targetType),
        eq(reactionsTable.targetId, String(targetId)),
      ),
    )
    .groupBy(reactionsTable.kind);

  const summary: Record<string, number> = {};
  for (const k of REACTION_KINDS) summary[k] = 0;
  for (const r of rows as any[]) {
    summary[r.kind as string] = Number(r.n);
  }

  // Mine — only if logged in.
  let mine: string[] = [];
  if (req.user) {
    const myRows = await db
      .select({ kind: reactionsTable.kind })
      .from(reactionsTable)
      .where(
        and(
          eq(reactionsTable.userId, req.user.id),
          eq(reactionsTable.targetType, targetType),
          eq(reactionsTable.targetId, String(targetId)),
        ),
      );
    mine = (myRows as any[]).map((r) => r.kind as string);
  }

  res.json({ summary, mine });
});

router.post("/reactions", requireAuth, async (req, res) => {
  const u = req.user!;
  const { targetType, targetId, kind } = req.body ?? {};
  if (
    !isTargetType(targetType) ||
    typeof targetId !== "string" ||
    !targetId ||
    !isReactionKind(kind)
  ) {
    res.status(400).json({ error: "Invalid reaction" });
    return;
  }
  await db
    .insert(reactionsTable)
    .values({
      userId: u.id,
      targetType,
      targetId: String(targetId),
      kind,
    })
    .onConflictDoNothing();

  await bumpStreak(u.id, 0).then(({ state, bumped }) => {
    if (bumped) evaluateStreakBadges(u.id, state.currentStreak);
  });

  res.json({ ok: true });
});

router.delete("/reactions", requireAuth, async (req, res) => {
  const u = req.user!;
  const targetType = (req.body?.targetType ?? req.query.targetType) as unknown;
  const targetId = (req.body?.targetId ?? req.query.targetId) as unknown;
  const kind = (req.body?.kind ?? req.query.kind) as unknown;
  if (
    !isTargetType(targetType) ||
    typeof targetId !== "string" ||
    !targetId ||
    !isReactionKind(kind)
  ) {
    res.status(400).json({ error: "Invalid reaction" });
    return;
  }
  await db
    .delete(reactionsTable)
    .where(
      and(
        eq(reactionsTable.userId, u.id),
        eq(reactionsTable.targetType, targetType),
        eq(reactionsTable.targetId, String(targetId)),
        eq(reactionsTable.kind, kind),
      ),
    );
  res.json({ ok: true });
});

export default router;
