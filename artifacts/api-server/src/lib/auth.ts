import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";

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

const COOKIE = "guzo_sid";
const SECRET = process.env.SESSION_SECRET ?? "";
if (!SECRET || SECRET.length < 16) {
  throw new Error(
    "SESSION_SECRET must be set to a strong value (at least 16 chars) before the API server can start. Refusing to boot.",
  );
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function makeToken(userId: number, issuedAt: number): string {
  const payload = `${userId}.${issuedAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [uidStr, iatStr, sig] = parts;
  const expected = sign(`${uidStr}.${iatStr}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  const uid = Number(uidStr);
  const iat = Number(iatStr);
  if (!Number.isFinite(uid) || uid <= 0) return null;
  if (!Number.isFinite(iat) || iat <= 0) return null;
  // 30-day max session age.
  if (Date.now() - iat > 1000 * 60 * 60 * 24 * 30) return null;
  return uid;
}

export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[COOKIE];
  if (typeof token === "string" && token) {
    const uid = verifyToken(token);
    if (uid != null) {
      const [u] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, uid))
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
  const token = makeToken(userId, Date.now());
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE, { path: "/" });
  // Also clear the legacy unsigned cookie name from older deploys.
  res.clearCookie("guzo_uid", { path: "/" });
}
