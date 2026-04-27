import type { Request } from "express";
import { db, auditLogTable } from "@workspace/db";
import { logger } from "./logger";

/**
 * Append-only audit log writer. Never throws — failures are logged but the
 * caller's response should still succeed to avoid hiding the underlying action.
 */
export async function recordAudit(
  req: Request,
  action: string,
  targetType: string,
  targetId: string | number | null | undefined,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db.insert(auditLogTable).values({
      actorId: req.user?.id ?? null,
      actorEmail: req.user?.email ?? "anonymous",
      actorRole: req.user?.role ?? "anonymous",
      action,
      targetType,
      targetId: targetId == null ? "" : String(targetId),
      metadata,
      ip: (req.headers["x-forwarded-for"]?.toString() ?? req.ip ?? "").slice(0, 64),
    });
  } catch (err) {
    logger.error?.({ err, action, targetType, targetId }, "audit_write_failed");
  }
}
