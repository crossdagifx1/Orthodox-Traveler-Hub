import { Router, type IRouter } from "express";
import { db, marketplaceItemsTable, usersTable } from "@workspace/db";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import {
  CreateMarketplaceItemBody,
  UpdateMarketplaceItemBody,
  ListMarketplaceItemsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function serialize(m: any) {
  const item = m.marketplace_items || m;
  const user = m.users;
  return {
    id: String(item.id),
    title: item.title,
    category: item.category,
    price: Number(item.price),
    currency: item.currency,
    description: item.description,
    imageUrl: item.imageUrl,
    sellerName: item.sellerName,
    sellerLocation: item.sellerLocation ?? "",
    sellerIsVerified: !!user?.isVerified,
    condition: item.condition,
    inStock: item.inStock,
    isFeatured: item.isFeatured,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/marketplace/items", async (req, res) => {
  const parsed = ListMarketplaceItemsQueryParams.safeParse(req.query);
  const category = parsed.success ? parsed.data.category : undefined;
  const q = parsed.success ? parsed.data.q : undefined;
  const conditions = [] as ReturnType<typeof eq>[];
  if (category) conditions.push(eq(marketplaceItemsTable.category, category));
  if (q)
    conditions.push(
      or(
        ilike(marketplaceItemsTable.title, `%${q}%`),
        ilike(marketplaceItemsTable.description, `%${q}%`),
      )!,
    );
  const rows = await db
    .select()
    .from(marketplaceItemsTable)
    .leftJoin(usersTable, eq(marketplaceItemsTable.userId, usersTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(marketplaceItemsTable.isFeatured), desc(marketplaceItemsTable.createdAt));
  res.json(rows.map(serialize));
});

router.get("/marketplace/items/featured", async (_req, res) => {
  const rows = await db
    .select()
    .from(marketplaceItemsTable)
    .leftJoin(usersTable, eq(marketplaceItemsTable.userId, usersTable.id))
    .where(eq(marketplaceItemsTable.isFeatured, true))
    .orderBy(desc(marketplaceItemsTable.createdAt));
  res.json(rows.map(serialize));
});

router.get("/marketplace/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(marketplaceItemsTable)
    .leftJoin(usersTable, eq(marketplaceItemsTable.userId, usersTable.id))
    .where(eq(marketplaceItemsTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.post("/marketplace/items", requireAuth, async (req, res) => {
  const parsed = CreateMarketplaceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const v = parsed.data;
  const [row] = await db
    .insert(marketplaceItemsTable)
    .values({
      title: v.title,
      category: v.category,
      price: String(v.price),
      currency: v.currency ?? "USD",
      description: v.description,
      imageUrl: v.imageUrl,
      sellerName: v.sellerName,
      sellerLocation: v.sellerLocation ?? "",
      condition: v.condition ?? "New",
      inStock: v.inStock ?? true,
      isFeatured: v.isFeatured ?? false,
    })
    .returning();
  res.json(serialize(row!));
});

router.patch("/marketplace/items/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateMarketplaceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const v = parsed.data;
  const update: Record<string, unknown> = { ...v };
  if (typeof v.price === "number") update.price = String(v.price);
  const [row] = await db
    .update(marketplaceItemsTable)
    .set(update)
    .where(eq(marketplaceItemsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/marketplace/items/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(marketplaceItemsTable).where(eq(marketplaceItemsTable.id, id));
  res.json({ ok: true });
});

export default router;
