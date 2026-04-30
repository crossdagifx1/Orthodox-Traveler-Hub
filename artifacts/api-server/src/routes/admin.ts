import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  destinationsTable,
  churchesTable,
  marketplaceItemsTable,
  mezmursTable,
  newsPostsTable,
  auditLogTable,
  systemSettingsTable,
} from "@workspace/db";
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import {
  requireAdmin,
  requireSuperAdmin,
  ROLE_RANK,
  type AuthRole,
} from "../lib/auth";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

const ALLOWED_ROLES: AuthRole[] = ["user", "moderator", "admin", "superadmin"];
const ALLOWED_STATUSES = ["active", "suspended", "banned"] as const;

/**
 * Returns the count of users that currently count as an *effective* super-admin —
 * role=superadmin AND status=active. Used to guard against bricking the system
 * by demoting / banning / deleting the last operator.
 */
async function countActiveSuperadmins(excludeUserId?: number): Promise<number> {
  const conds = [eq(usersTable.role, "superadmin"), eq(usersTable.status, "active")];
  if (excludeUserId !== undefined) {
    conds.push(sql`${usersTable.id} <> ${excludeUserId}`);
  }
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(and(...conds));
  return Number(c ?? 0);
}

function serializeUser(u: typeof usersTable.$inferSelect) {
  return {
    id: String(u.id),
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    suspendedUntil: u.suspendedUntil ? u.suspendedUntil.toISOString() : null,
    notes: u.notes,
    createdAt: u.createdAt.toISOString(),
  };
}

// ───────────────────────────── USERS ─────────────────────────────
router.get("/admin/users", requireAdmin, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const role = String(req.query.role ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  const limit = Math.min(Number(req.query.limit ?? 100) || 100, 500);

  const conditions = [];
  if (q) {
    conditions.push(or(ilike(usersTable.email, `%${q}%`), ilike(usersTable.name, `%${q}%`)));
  }
  if (role && ALLOWED_ROLES.includes(role as AuthRole)) {
    conditions.push(eq(usersTable.role, role));
  }
  if (status && ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    conditions.push(eq(usersTable.status, status));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const rows = await db
    .select()
    .from(usersTable)
    .where(where)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit);
  res.json(rows.map(serializeUser));
});

router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeUser(row));
});

router.patch("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const actor = req.user!;
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!target) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const body = req.body ?? {};
  const updates: Partial<typeof usersTable.$inferInsert> = {};

  // Name
  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim().slice(0, 255);
  }
  // Notes (admin internal note)
  if (typeof body.notes === "string") {
    updates.notes = body.notes.slice(0, 4000);
  }

  // Role
  if (typeof body.role === "string") {
    const newRole = body.role as AuthRole;
    if (!ALLOWED_ROLES.includes(newRole)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    if (newRole !== target.role) {
      // Only super-admins can promote into / demote from admin or superadmin tiers.
      const touchingPriv =
        ROLE_RANK[target.role as AuthRole] >= ROLE_RANK.admin ||
        ROLE_RANK[newRole] >= ROLE_RANK.admin;
      if (touchingPriv && actor.role !== "superadmin") {
        res.status(403).json({ error: "Only super-admin can change admin/superadmin roles" });
        return;
      }
      // Actors cannot raise a target above their own rank.
      if (ROLE_RANK[newRole] > ROLE_RANK[actor.role]) {
        res.status(403).json({ error: "Cannot grant a role higher than your own" });
        return;
      }
      // Demoting any super-admin (self or other) requires at least one OTHER
      // active super-admin to remain. Status-aware: a banned/suspended super-admin
      // does not count.
      if (target.role === "superadmin" && newRole !== "superadmin") {
        const remaining = await countActiveSuperadmins(target.id);
        if (remaining < 1) {
          res
            .status(400)
            .json({ error: "Cannot demote the last active super-admin" });
          return;
        }
      }
      updates.role = newRole;
    }
  }

  // Status
  if (typeof body.status === "string") {
    const newStatus = body.status as (typeof ALLOWED_STATUSES)[number];
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    // Cannot suspend/ban anyone of equal or higher rank than yourself,
    // unless you are super-admin acting on a non-super-admin.
    if (newStatus !== "active") {
      const targetRank = ROLE_RANK[target.role as AuthRole];
      if (targetRank >= ROLE_RANK[actor.role] && actor.role !== "superadmin") {
        res.status(403).json({ error: "Cannot suspend/ban a user of equal or higher rank" });
        return;
      }
      if (target.id === actor.id) {
        res.status(400).json({ error: "Cannot suspend/ban your own account" });
        return;
      }
      // Suspending/banning a super-admin must leave at least one other active
      // super-admin behind, otherwise the system would lose all super-admin coverage.
      if (target.role === "superadmin" && target.status === "active") {
        const remaining = await countActiveSuperadmins(target.id);
        if (remaining < 1) {
          res
            .status(400)
            .json({ error: "Cannot suspend/ban the last active super-admin" });
          return;
        }
      }
    }
    updates.status = newStatus;
    if (newStatus === "active") {
      updates.suspendedUntil = null;
    }
  }
  if (body.suspendedUntil !== undefined) {
    if (body.suspendedUntil === null) {
      updates.suspendedUntil = null;
    } else if (typeof body.suspendedUntil === "string") {
      const d = new Date(body.suspendedUntil);
      if (Number.isNaN(d.getTime())) {
        res.status(400).json({ error: "Invalid suspendedUntil" });
        return;
      }
      updates.suspendedUntil = d;
    }
  }

  if (Object.keys(updates).length === 0) {
    res.json(serializeUser(target));
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  await recordAudit(req, "user.update", "user", id, {
    before: {
      role: target.role,
      status: target.status,
      name: target.name,
    },
    after: updates,
  });

  res.json(serializeUser(updated!));
});

router.delete("/admin/users/:id", requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const actor = req.user!;
  if (id === actor.id) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!target) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  // Don't allow deletion of the last active super-admin.
  if (target.role === "superadmin") {
    const remaining = await countActiveSuperadmins(target.id);
    if (remaining < 1) {
      res.status(400).json({ error: "Cannot delete the last active super-admin" });
      return;
    }
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  await recordAudit(req, "user.delete", "user", id, {
    email: target.email,
    role: target.role,
  });
  res.json({ ok: true });
});

// ───────────────────────────── AUDIT LOG ─────────────────────────────
router.get("/admin/audit", requireAdmin, async (req, res) => {
  const actorId = req.query.actorId ? Number(req.query.actorId) : null;
  const action = String(req.query.action ?? "").trim();
  const targetType = String(req.query.targetType ?? "").trim();
  const limit = Math.min(Number(req.query.limit ?? 100) || 100, 500);

  const conds = [];
  if (actorId && Number.isFinite(actorId)) conds.push(eq(auditLogTable.actorId, actorId));
  if (action) conds.push(eq(auditLogTable.action, action));
  if (targetType) conds.push(eq(auditLogTable.targetType, targetType));

  const rows = await db
    .select()
    .from(auditLogTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(limit);

  res.json(
    rows.map((r: any) => ({
      id: String(r.id),
      actorId: r.actorId ?? null,
      actorEmail: r.actorEmail,
      actorRole: r.actorRole,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      metadata: r.metadata ?? {},
      ip: r.ip,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

// ───────────────────────────── ANALYTICS ─────────────────────────────
router.get("/admin/analytics/overview", requireAdmin, async (_req, res) => {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  async function countWhere<T extends { c: number }>(
    table: any,
    where: any = undefined,
  ): Promise<number> {
    const q = db.select({ c: sql<number>`count(*)::int` }).from(table) as any;
    const [row] = where ? await q.where(where) : await q;
    return (row?.c ?? 0) as number;
  }

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    adminUsers,
    superadminUsers,
    moderatorUsers,
    recentUsers,
    destCount,
    chCount,
    mkCount,
    mzCount,
    newsCount,
    auditTotal,
    audit24h,
  ] = await Promise.all([
    countWhere(usersTable),
    countWhere(usersTable, eq(usersTable.status, "active")),
    countWhere(usersTable, eq(usersTable.status, "suspended")),
    countWhere(usersTable, eq(usersTable.status, "banned")),
    countWhere(usersTable, eq(usersTable.role, "admin")),
    countWhere(usersTable, eq(usersTable.role, "superadmin")),
    countWhere(usersTable, eq(usersTable.role, "moderator")),
    countWhere(usersTable, gte(usersTable.createdAt, weekAgo)),
    countWhere(destinationsTable),
    countWhere(churchesTable),
    countWhere(marketplaceItemsTable),
    countWhere(mezmursTable),
    countWhere(newsPostsTable),
    countWhere(auditLogTable),
    countWhere(auditLogTable, gte(auditLogTable.createdAt, dayAgo)),
  ]);

  res.json({
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      banned: bannedUsers,
      admins: adminUsers,
      superadmins: superadminUsers,
      moderators: moderatorUsers,
      recent: recentUsers,
    },
    content: {
      destinations: destCount,
      churches: chCount,
      marketplaceItems: mkCount,
      mezmurs: mzCount,
      newsPosts: newsCount,
    },
    audit: {
      total: auditTotal,
      last24h: audit24h,
    },
  });
});

// ───────────────────────────── SYSTEM SETTINGS ─────────────────────────────
function serializeSetting(s: typeof systemSettingsTable.$inferSelect) {
  return {
    key: s.key,
    value: s.value ?? {},
    description: s.description ?? "",
    updatedAt: s.updatedAt.toISOString(),
    updatedBy: s.updatedBy ?? null,
  };
}

// System settings can contain sensitive operational config; restrict read+write to super-admin.
router.get("/admin/system/settings", requireSuperAdmin, async (_req, res) => {
  const rows = await db.select().from(systemSettingsTable).orderBy(systemSettingsTable.key);
  res.json(rows.map(serializeSetting));
});

router.patch("/admin/system/settings", requireSuperAdmin, async (req, res) => {
  const body = req.body ?? {};
  const key = typeof body.key === "string" ? body.key.trim().slice(0, 128) : "";
  if (!key) {
    res.status(400).json({ error: "key is required" });
    return;
  }
  if (body.value === undefined) {
    res.status(400).json({ error: "value is required" });
    return;
  }
  const description = typeof body.description === "string" ? body.description.slice(0, 2000) : "";

  const [existing] = await db
    .select()
    .from(systemSettingsTable)
    .where(eq(systemSettingsTable.key, key))
    .limit(1);

  let row;
  if (existing) {
    [row] = await db
      .update(systemSettingsTable)
      .set({
        value: body.value,
        description,
        updatedAt: new Date(),
        updatedBy: req.user!.id,
      })
      .where(eq(systemSettingsTable.key, key))
      .returning();
  } else {
    [row] = await db
      .insert(systemSettingsTable)
      .values({
        key,
        value: body.value,
        description,
        updatedBy: req.user!.id,
      })
      .returning();
  }

  await recordAudit(req, "system.settings.update", "system_setting", key, {
    value: body.value,
  });

  res.json(serializeSetting(row!));
});

export default router;
