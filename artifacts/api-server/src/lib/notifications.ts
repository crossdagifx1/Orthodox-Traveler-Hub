import { db, notificationsTable } from "@workspace/db";
import { logger } from "./logger";

export type NotifKind =
  | "badge_awarded"
  | "comment_reply"
  | "comment_liked"
  | "challenge_new"
  | "account_status";

/**
 * Insert a notification for the given user. Never throws — failures are
 * logged but don't surface to the caller.
 */
export async function notify(
  userId: number,
  kind: NotifKind,
  title: string,
  body = "",
  link = "",
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      userId,
      kind,
      title,
      body,
      link,
      metadata,
    });
  } catch (err) {
    logger.error?.({ err, userId, kind }, "notify_failed");
  }
}
