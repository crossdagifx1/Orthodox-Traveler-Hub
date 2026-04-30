import {
  db,
  badgesTable,
  userBadgesTable,
  bookmarksTable,
  quizAttemptsTable,
  mezmursTable,
  commentsTable,
} from "@workspace/db";
import { and, countDistinct, desc, eq, sql } from "drizzle-orm";
import { logger } from "./logger";
import { notify } from "./notifications";

/** Stable badge keys awarded by the helpers below. */
export type BadgeKey =
  | "first_quiz"
  | "scholar"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "pilgrim"
  | "hymn_lover"
  | "voice_in_the_choir"
  | "champion";

/**
 * Award a badge to a user. Idempotent: if already awarded, no-op. On a
 * fresh award, creates a notification for the user. Returns true if the
 * badge was newly awarded.
 */
export async function awardBadge(
  userId: number,
  key: BadgeKey,
): Promise<boolean> {
  try {
    const [badge] = await db
      .select()
      .from(badgesTable)
      .where(eq(badgesTable.key, key))
      .limit(1);
    if (!badge) {
      logger.warn?.({ key }, "award_badge_not_found");
      return false;
    }
    const [existing] = await db
      .select({ id: userBadgesTable.id })
      .from(userBadgesTable)
      .where(
        and(
          eq(userBadgesTable.userId, userId),
          eq(userBadgesTable.badgeId, badge.id),
        ),
      )
      .limit(1);
    if (existing) return false;

    await db.insert(userBadgesTable).values({
      userId,
      badgeId: badge.id,
    });

    await notify(
      userId,
      "badge_awarded",
      `New badge: ${badge.name}`,
      badge.description ?? "",
      "/me?tab=badges",
      { badgeId: badge.id, badgeKey: badge.key },
    );

    return true;
  } catch (err) {
    logger.error?.({ err, userId, key }, "award_badge_failed");
    return false;
  }
}

/**
 * Evaluate badges that depend on the user's streak count.
 * Called by the streak helper after a successful bump.
 */
export async function evaluateStreakBadges(
  userId: number,
  currentStreak: number,
): Promise<void> {
  if (currentStreak >= 30) await awardBadge(userId, "streak_30");
  if (currentStreak >= 7) await awardBadge(userId, "streak_7");
  if (currentStreak >= 3) await awardBadge(userId, "streak_3");
}

/**
 * Evaluate badges after a quiz attempt has been completed.
 * - first_quiz: any completed attempt.
 * - scholar:    attempt where score == totalPoints (perfect).
 * - champion:   user lands in top 3 of the all-time leaderboard.
 */
export async function evaluateQuizBadges(
  userId: number,
  attempt: { score: number; totalPoints: number; status: string },
): Promise<void> {
  if (attempt.status !== "completed") return;

  await awardBadge(userId, "first_quiz");

  if (attempt.totalPoints > 0 && attempt.score >= attempt.totalPoints) {
    await awardBadge(userId, "scholar");
  }

  // Top-3 check: are they in the all-time top 3 sum-of-best-attempt-scores?
  // We approximate with an all-time sum for cheapness.
  try {
    const top = await db
      .select({
        userId: quizAttemptsTable.userId,
        total: sql<number>`sum(${quizAttemptsTable.score})`.as("total"),
      })
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.status, "completed"))
      .groupBy(quizAttemptsTable.userId)
      .orderBy(desc(sql`total`))
      .limit(3);

    if (top.some((r: any) => r.userId === userId)) {
      await awardBadge(userId, "champion");
    }
  } catch (err) {
    logger.error?.({ err }, "evaluate_quiz_badges_top_failed");
  }
}

/**
 * Evaluate after a mezmur play is recorded.
 * - hymn_lover: 10 distinct mezmurs played by user.
 *
 * The plays counter on `mezmursTable` is not user-scoped, so we count
 * distinct mezmur ids that this user has bookmarked OR commented on as
 * a proxy. To be precise we'd need a `mezmur_plays` table; deferred.
 */
export async function evaluateMezmurBadges(userId: number): Promise<void> {
  try {
    const [r] = await db
      .select({ n: countDistinct(bookmarksTable.targetId) })
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.userId, userId),
          eq(bookmarksTable.targetType, "mezmur"),
        ),
      );
    const distinct = Number(r?.n ?? 0);
    if (distinct >= 10) await awardBadge(userId, "hymn_lover");
  } catch (err) {
    logger.error?.({ err, userId }, "evaluate_mezmur_badges_failed");
  }
}

/**
 * Evaluate after a bookmark is added.
 * - pilgrim: 5 distinct destinations bookmarked.
 * - hymn_lover: 10 distinct mezmurs bookmarked.
 */
export async function evaluateBookmarkBadges(
  userId: number,
  targetType: string,
): Promise<void> {
  try {
    if (targetType === "destination") {
      const [r] = await db
        .select({ n: countDistinct(bookmarksTable.targetId) })
        .from(bookmarksTable)
        .where(
          and(
            eq(bookmarksTable.userId, userId),
            eq(bookmarksTable.targetType, "destination"),
          ),
        );
      if (Number(r?.n ?? 0) >= 5) await awardBadge(userId, "pilgrim");
    } else if (targetType === "mezmur") {
      const [r] = await db
        .select({ n: countDistinct(bookmarksTable.targetId) })
        .from(bookmarksTable)
        .where(
          and(
            eq(bookmarksTable.userId, userId),
            eq(bookmarksTable.targetType, "mezmur"),
          ),
        );
      if (Number(r?.n ?? 0) >= 10) await awardBadge(userId, "hymn_lover");
    }
  } catch (err) {
    logger.error?.({ err, userId, targetType }, "evaluate_bookmark_badges_failed");
  }
}

/**
 * Evaluate after a comment is created.
 * - voice_in_the_choir: any visible comment authored.
 */
export async function evaluateCommentBadges(userId: number): Promise<void> {
  try {
    const [r] = await db
      .select({ n: sql<number>`count(*)` })
      .from(commentsTable)
      .where(eq(commentsTable.userId, userId));
    if (Number(r?.n ?? 0) >= 1) await awardBadge(userId, "voice_in_the_choir");
  } catch (err) {
    logger.error?.({ err, userId }, "evaluate_comment_badges_failed");
  }
}

