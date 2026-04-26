import { Router, type IRouter } from "express";
import { db, newsPostsTable } from "@workspace/db";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import {
  CreateNewsPostBody,
  UpdateNewsPostBody,
  ListNewsQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function serialize(n: typeof newsPostsTable.$inferSelect) {
  return {
    id: String(n.id),
    title: n.title,
    slug: n.slug,
    excerpt: n.excerpt,
    content: n.content,
    category: n.category,
    author: n.author,
    coverUrl: n.coverUrl,
    readMinutes: n.readMinutes,
    publishedAt: n.publishedAt.toISOString(),
  };
}

router.get("/news", async (req, res) => {
  const parsed = ListNewsQueryParams.safeParse(req.query);
  const category = parsed.success ? parsed.data.category : undefined;
  const q = parsed.success ? parsed.data.q : undefined;
  const conditions = [] as ReturnType<typeof eq>[];
  if (category) conditions.push(eq(newsPostsTable.category, category));
  if (q)
    conditions.push(
      or(
        ilike(newsPostsTable.title, `%${q}%`),
        ilike(newsPostsTable.excerpt, `%${q}%`),
      )!,
    );
  const rows = await db
    .select()
    .from(newsPostsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(newsPostsTable.publishedAt));
  res.json(rows.map(serialize));
});

router.get("/news/latest", async (_req, res) => {
  const rows = await db
    .select()
    .from(newsPostsTable)
    .orderBy(desc(newsPostsTable.publishedAt))
    .limit(5);
  res.json(rows.map(serialize));
});

router.get("/news/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(newsPostsTable)
    .where(eq(newsPostsTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.post("/news", requireAdmin, async (req, res) => {
  const parsed = CreateNewsPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const v = parsed.data;
  const slug = `${slugify(v.title)}-${Date.now().toString(36)}`;
  const [row] = await db
    .insert(newsPostsTable)
    .values({
      title: v.title,
      slug,
      excerpt: v.excerpt,
      content: v.content,
      category: v.category,
      author: v.author,
      coverUrl: v.coverUrl,
      readMinutes: v.readMinutes ?? 3,
    })
    .returning();
  res.json(serialize(row!));
});

router.patch("/news/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateNewsPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(newsPostsTable)
    .set(parsed.data)
    .where(eq(newsPostsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/news/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(newsPostsTable).where(eq(newsPostsTable.id, id));
  res.json({ ok: true });
});

export default router;
