import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";
import { setAuthCookie, clearAuthCookie } from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/me", (req, res) => {
  res.json({
    user: req.user
      ? {
          id: String(req.user.id),
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
        }
      : null,
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, name } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();
  const displayName = (name?.trim() || cleanEmail.split("@")[0] || "Friend") as string;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, cleanEmail))
    .limit(1);

  let user = existing[0];
  if (!user) {
    const inserted = await db
      .insert(usersTable)
      .values({ email: cleanEmail, name: displayName, role: "user" })
      .returning();
    user = inserted[0];
  }
  if (!user) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }
  setAuthCookie(res, user.id);
  res.json({
    id: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
  });
});

router.post("/auth/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
