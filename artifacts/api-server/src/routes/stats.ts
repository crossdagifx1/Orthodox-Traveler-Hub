import { Router, type IRouter } from "express";
import {
  db,
  destinationsTable,
  churchesTable,
  marketplaceItemsTable,
  mezmursTable,
  newsPostsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats/overview", async (_req, res) => {
  const [d] = await db.select({ c: sql<number>`count(*)::int` }).from(destinationsTable);
  const [ch] = await db.select({ c: sql<number>`count(*)::int` }).from(churchesTable);
  const [m] = await db.select({ c: sql<number>`count(*)::int` }).from(marketplaceItemsTable);
  const [mz] = await db.select({ c: sql<number>`count(*)::int` }).from(mezmursTable);
  const [n] = await db.select({ c: sql<number>`count(*)::int` }).from(newsPostsTable);
  const [co] = await db
    .select({ c: sql<number>`count(distinct ${churchesTable.country})::int` })
    .from(churchesTable);
  res.json({
    destinations: d?.c ?? 0,
    churches: ch?.c ?? 0,
    marketplaceItems: m?.c ?? 0,
    mezmurs: mz?.c ?? 0,
    newsPosts: n?.c ?? 0,
    countries: co?.c ?? 0,
  });
});

export default router;
