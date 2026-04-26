import { Router, type IRouter } from "express";
import { db, mezmursTable } from "@workspace/db";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  CreateMezmurBody,
  UpdateMezmurBody,
  ListMezmursQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function serialize(m: typeof mezmursTable.$inferSelect) {
  return {
    id: String(m.id),
    title: m.title,
    artist: m.artist,
    category: m.category,
    language: m.language,
    duration: m.duration,
    coverUrl: m.coverUrl,
    audioUrl: m.audioUrl,
    lyrics: m.lyrics ?? "",
    plays: m.plays,
    isTrending: m.isTrending,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/mezmurs", async (req, res) => {
  const parsed = ListMezmursQueryParams.safeParse(req.query);
  const category = parsed.success ? parsed.data.category : undefined;
  const q = parsed.success ? parsed.data.q : undefined;
  const conditions = [] as ReturnType<typeof eq>[];
  if (category) conditions.push(eq(mezmursTable.category, category));
  if (q)
    conditions.push(
      or(
        ilike(mezmursTable.title, `%${q}%`),
        ilike(mezmursTable.artist, `%${q}%`),
      )!,
    );
  const rows = await db
    .select()
    .from(mezmursTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(mezmursTable.isTrending), desc(mezmursTable.plays));
  res.json(rows.map(serialize));
});

router.get("/mezmurs/trending", async (_req, res) => {
  const rows = await db
    .select()
    .from(mezmursTable)
    .where(eq(mezmursTable.isTrending, true))
    .orderBy(desc(mezmursTable.plays));
  res.json(rows.map(serialize));
});

router.get("/mezmurs/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(mezmursTable)
    .where(eq(mezmursTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.post("/mezmurs", requireAdmin, async (req, res) => {
  const parsed = CreateMezmurBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const v = parsed.data;
  const [row] = await db
    .insert(mezmursTable)
    .values({
      title: v.title,
      artist: v.artist,
      category: v.category,
      language: v.language ?? "Amharic",
      duration: v.duration,
      coverUrl: v.coverUrl,
      audioUrl: v.audioUrl,
      lyrics: v.lyrics ?? "",
      isTrending: v.isTrending ?? false,
    })
    .returning();
  res.json(serialize(row!));
});

router.patch("/mezmurs/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateMezmurBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(mezmursTable)
    .set(parsed.data)
    .where(eq(mezmursTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/mezmurs/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(mezmursTable).where(eq(mezmursTable.id, id));
  res.json({ ok: true });
});

router.post("/mezmurs/:id/play", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .update(mezmursTable)
    .set({ plays: sql`${mezmursTable.plays} + 1` })
    .where(eq(mezmursTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

export default router;
