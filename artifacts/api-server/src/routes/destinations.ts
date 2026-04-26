import { Router, type IRouter } from "express";
import { db, destinationsTable } from "@workspace/db";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import {
  CreateDestinationBody,
  UpdateDestinationBody,
  ListDestinationsQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function serialize(d: typeof destinationsTable.$inferSelect) {
  return {
    id: String(d.id),
    name: d.name,
    region: d.region,
    country: d.country,
    shortDescription: d.shortDescription,
    description: d.description,
    imageUrl: d.imageUrl,
    gallery: d.gallery ?? [],
    latitude: d.latitude,
    longitude: d.longitude,
    bestSeason: d.bestSeason ?? "",
    feastDay: d.feastDay ?? "",
    founded: d.founded ?? "",
    isFeatured: d.isFeatured,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/destinations", async (req, res) => {
  const parsed = ListDestinationsQueryParams.safeParse(req.query);
  const region = parsed.success ? parsed.data.region : undefined;
  const q = parsed.success ? parsed.data.q : undefined;
  const conditions = [] as ReturnType<typeof eq>[];
  if (region) conditions.push(eq(destinationsTable.region, region));
  if (q)
    conditions.push(
      or(
        ilike(destinationsTable.name, `%${q}%`),
        ilike(destinationsTable.country, `%${q}%`),
        ilike(destinationsTable.shortDescription, `%${q}%`),
      )!,
    );
  const rows = await db
    .select()
    .from(destinationsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(destinationsTable.isFeatured), desc(destinationsTable.createdAt));
  res.json(rows.map(serialize));
});

router.get("/destinations/featured", async (_req, res) => {
  const rows = await db
    .select()
    .from(destinationsTable)
    .where(eq(destinationsTable.isFeatured, true))
    .orderBy(desc(destinationsTable.createdAt));
  res.json(rows.map(serialize));
});

router.get("/destinations/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [row] = await db
    .select()
    .from(destinationsTable)
    .where(eq(destinationsTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.post("/destinations", requireAdmin, async (req, res) => {
  const parsed = CreateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const v = parsed.data;
  const [row] = await db
    .insert(destinationsTable)
    .values({
      name: v.name,
      region: v.region,
      country: v.country,
      shortDescription: v.shortDescription,
      description: v.description,
      imageUrl: v.imageUrl,
      gallery: v.gallery ?? [],
      latitude: v.latitude,
      longitude: v.longitude,
      bestSeason: v.bestSeason ?? "",
      feastDay: v.feastDay ?? "",
      founded: v.founded ?? "",
      isFeatured: v.isFeatured ?? false,
    })
    .returning();
  res.json(serialize(row!));
});

router.patch("/destinations/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(destinationsTable)
    .set(parsed.data)
    .where(eq(destinationsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/destinations/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(destinationsTable).where(eq(destinationsTable.id, id));
  res.json({ ok: true });
});

export default router;
