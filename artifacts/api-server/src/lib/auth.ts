import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin" | "superadmin";
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const COOKIE = "guzo_uid";

export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const uid = req.cookies?.[COOKIE];
  if (uid) {
    const id = Number(uid);
    if (Number.isFinite(id) && id > 0) {
      const [u] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);
      if (u) {
        req.user = {
          id: u.id,
          email: u.email,
          name: u.name,
          role: (u.role as AuthUser["role"]) ?? "user",
        };
      }
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}

export function setAuthCookie(res: Response, userId: number) {
  res.cookie(COOKIE, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE, { path: "/" });
}
