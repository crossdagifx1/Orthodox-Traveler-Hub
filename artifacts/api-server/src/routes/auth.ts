import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";
import bcrypt from "bcryptjs";
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
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { email, password, name } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();
  const displayName = (name?.trim() || cleanEmail.split("@")[0] || "Friend") as string;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, cleanEmail))
    .limit(1);

  const user0 = existing[0];
  let user = user0;
  if (user0) {
    if (!user0.passwordHash) {
      // Legacy / seeded account that never set a password.
      // Refuse login outright — auto-claiming would let anyone take over the account
      // simply by knowing the email. A separate, possession-proven reset flow is required.
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const ok = await bcrypt.compare(password, user0.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
  } else {
    // Sign-up flow: create a new account at first login.
    const newHash = await bcrypt.hash(password, 10);
    const inserted = await db
      .insert(usersTable)
      .values({
        email: cleanEmail,
        name: displayName,
        passwordHash: newHash,
        role: "user",
      })
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
