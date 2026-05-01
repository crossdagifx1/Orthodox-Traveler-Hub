import { Router, type IRouter } from "express";
import { db, itinerariesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

/** List public itineraries or those belonging to a specific user */
router.get("/itineraries", async (req, res) => {
  const userId = req.query.userId;
  const conds = [eq(itinerariesTable.isPublic, true)];
  if (userId) {
    conds.push(eq(itinerariesTable.userId, Number(userId)));
  }
  try {
    const rows = await db
      .select()
      .from(itinerariesTable)
      .where(and(...conds))
      .orderBy(desc(itinerariesTable.createdAt));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch itineraries" });
  }
});

/** Get current user's itineraries */
router.get("/me/itineraries", requireAuth, async (req, res) => {
  const u = req.user!;
  try {
    const rows = await db
      .select()
      .from(itinerariesTable)
      .where(eq(itinerariesTable.userId, u.id))
      .orderBy(desc(itinerariesTable.createdAt));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch your itineraries" });
  }
});

/** Create a new itinerary */
router.post("/me/itineraries", requireAuth, async (req, res) => {
  const u = req.user!;
  const { title, description, isPublic, items } = req.body ?? {};
  if (!title) {
    res.status(400).json({ error: "Title required" });
    return;
  }
  try {
    const [row] = await db
      .insert(itinerariesTable)
      .values({
        userId: u.id,
        title,
        description: description || "",
        isPublic: isPublic !== false,
        items: items || [],
      })
      .returning();
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: "Failed to create itinerary" });
  }
});

/** Get a single itinerary */
router.get("/itineraries/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [row] = await db
      .select()
      .from(itinerariesTable)
      .where(eq(itinerariesTable.id, id))
      .limit(1);
    
    if (!row) {
      res.status(404).json({ error: "Itinerary not found" });
      return;
    }

    if (!row.isPublic && (!req.user || req.user.id !== row.userId)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(row);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch itinerary" });
  }
});

export default router;
