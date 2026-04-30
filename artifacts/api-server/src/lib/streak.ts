import { db, streaksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

/**
 * Streak state used by helpers and returned via the API.
 */
export type StreakState = {
  userId: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  /** YYYY-MM-DD of the user's last activity (UTC). */
  lastActiveDate: string;
};

/** Convert a Date to a YYYY-MM-DD string in UTC. */
export function utcDateString(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diffDays(prev: string, next: string): number {
  if (!prev || !next) return Infinity;
  const a = new Date(prev + "T00:00:00Z").getTime();
  const b = new Date(next + "T00:00:00Z").getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Read-only fetch of the user's streak state. Returns a zero-valued
 * placeholder if the user has never been active.
 */
export async function getStreak(userId: number): Promise<StreakState> {
  const [row] = await db
    .select()
    .from(streaksTable)
    .where(eq(streaksTable.userId, userId))
    .limit(1);
  if (!row) {
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      lastActiveDate: "",
    };
  }
  return {
    userId: row.userId,
    currentStreak: row.currentStreak,
    longestStreak: row.longestStreak,
    totalPoints: row.totalPoints,
    lastActiveDate: row.lastActiveDate,
  };
}

/**
 * Bump the streak as the side-effect of an authenticated mutation.
 * - If the user was active today, no change.
 * - If active yesterday, increment current streak.
 * - Otherwise reset current streak to 1.
 *
 * Returns the new state and a `bumped` flag indicating whether the
 * `currentStreak` value advanced (used by callers to evaluate streak
 * badges only when the count actually changed).
 */
export async function bumpStreak(
  userId: number,
  pointsToAdd = 0,
): Promise<{ state: StreakState; bumped: boolean }> {
  const today = utcDateString();
  const existing = await getStreak(userId);

  let next: StreakState;
  let bumped = false;

  if (!existing.lastActiveDate) {
    next = {
      userId,
      currentStreak: 1,
      longestStreak: Math.max(existing.longestStreak, 1),
      totalPoints: existing.totalPoints + pointsToAdd,
      lastActiveDate: today,
    };
    bumped = true;
  } else if (existing.lastActiveDate === today) {
    next = {
      ...existing,
      totalPoints: existing.totalPoints + pointsToAdd,
    };
  } else {
    const days = diffDays(existing.lastActiveDate, today);
    if (days === 1) {
      const cur = existing.currentStreak + 1;
      next = {
        ...existing,
        currentStreak: cur,
        longestStreak: Math.max(existing.longestStreak, cur),
        totalPoints: existing.totalPoints + pointsToAdd,
        lastActiveDate: today,
      };
      bumped = true;
    } else {
      next = {
        ...existing,
        currentStreak: 1,
        longestStreak: Math.max(existing.longestStreak, 1),
        totalPoints: existing.totalPoints + pointsToAdd,
        lastActiveDate: today,
      };
      bumped = true;
    }
  }

  await db
    .insert(streaksTable)
    .values({
      userId,
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      totalPoints: next.totalPoints,
      lastActiveDate: next.lastActiveDate,
    })
    .onConflictDoUpdate({
      target: streaksTable.userId,
      set: {
        currentStreak: next.currentStreak,
        longestStreak: next.longestStreak,
        totalPoints: next.totalPoints,
        lastActiveDate: next.lastActiveDate,
        updatedAt: sql`now()`,
      },
    });

  return { state: next, bumped };
}

/**
 * Add points to a user's running total without touching the day-streak.
 * Convenience wrapper used by the quiz attempt finisher.
 */
export async function addPoints(userId: number, pts: number): Promise<void> {
  if (pts <= 0) return;
  const today = utcDateString();
  await db
    .insert(streaksTable)
    .values({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: pts,
      lastActiveDate: today,
    })
    .onConflictDoUpdate({
      target: streaksTable.userId,
      set: {
        totalPoints: sql`${streaksTable.totalPoints} + ${pts}`,
        updatedAt: sql`now()`,
      },
    });
}
