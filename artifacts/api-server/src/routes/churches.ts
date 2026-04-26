import { Router, type IRouter } from "express";
import { db, churchesTable } from "@workspace/db";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import {
  CreateChurchBody,
  UpdateChurchBody,
  ListChurchesQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function serialize(c: typeof churchesTable.$inferSelect) {
  return {
    id: String(c.id),
    name: c.name,
    city: c.city,
    country: c.country,
    address: c.address,
    latitude: c.latitude,
    longitude: c.longitude,
    phone: c.phone ?? "",
    website: c.website ?? "",
    priest: c.priest ?? "",
    liturgyTimes: c.liturgyTimes ?? "",
    imageUrl: c.imageUrl,
    description: c.description,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/churches", async (req, res) => {
  const parsed = ListChurchesQueryParams.safeParse(req.query);
  const country = parsed.success ? parsed.data.country : undefined;
  const q = parsed.success ? parsed.data.q : undefined;
  const conditions = [] as ReturnType<typeof eq>[];
  if (country) conditions.push(eq(churchesTable.country, country));
  if (q)
    conditions.push(
      or(
        ilike(churchesTable.name, `%${q}%`),
        ilike(churchesTable.city, `%${q}%`),
        ilike(churchesTable.country, `%${q}%`),
      )!,
    );
  const rows = await db
    .select()
    .from(churchesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(churchesTable.createdAt));
  res.json(rows.map(serialize));
});

router.get("/churches/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(churchesTable)
    .where(eq(churchesTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.post("/churches", requireAdmin, async (req, res) => {
  const parsed = CreateChurchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const v = parsed.data;
  const [row] = await db
    .insert(churchesTable)
    .values({
      name: v.name,
      city: v.city,
      country: v.country,
      address: v.address,
      latitude: v.latitude,
      longitude: v.longitude,
      phone: v.phone ?? "",
      website: v.website ?? "",
      priest: v.priest ?? "",
      liturgyTimes: v.liturgyTimes ?? "",
      imageUrl: v.imageUrl,
      description: v.description,
    })
    .returning();
  res.json(serialize(row!));
});

router.patch("/churches/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateChurchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(churchesTable)
    .set(parsed.data)
    .where(eq(churchesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/churches/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(churchesTable).where(eq(churchesTable.id, id));
  res.json({ ok: true });
});

export default router;
