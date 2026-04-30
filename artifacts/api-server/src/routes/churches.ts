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

/**
 * Cities and queries we sweep through to find Ethiopian Orthodox Tewahedo
 * churches with Google Places Text Search. Each (city, keyword) tuple becomes
 * one Text Search call (paginated up to 3 pages = 60 results).
 */
const SYNC_CITIES = [
  "Addis Ababa, Ethiopia",
  "Lalibela, Ethiopia",
  "Axum, Ethiopia",
  "Gondar, Ethiopia",
  "Bahir Dar, Ethiopia",
  "Mekelle, Ethiopia",
  "Dire Dawa, Ethiopia",
  "Hawassa, Ethiopia",
  "Jimma, Ethiopia",
  "Adama, Ethiopia",
] as const;

const SYNC_KEYWORDS = [
  "Ethiopian Orthodox Tewahedo Church",
  "Orthodox Cathedral",
  "Bete Christian",
] as const;

interface PlaceTextSearchResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  photos?: Array<{ photo_reference: string }>;
  rating?: number;
  types?: string[];
}

interface PlaceDetailsResult {
  result?: {
    international_phone_number?: string;
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: { weekday_text?: string[] };
  };
  status?: string;
}

/** Sleep helper — Text Search next_page_token is not valid for ~2s. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Distance in meters between two lat/lng points (Haversine). */
function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Sync Ethiopian Orthodox churches from Google Places into the `churches`
 * table. Sweeps across major Ethiopian cities × Orthodox-related keywords,
 * pages through Text Search results, fetches Place Details for any new
 * candidate, and dedupes against existing rows by name + coordinate proximity
 * (~150m). Returns counts of inserted, skipped (duplicate), and total seen.
 */
router.post("/churches/sync-google-places", requireAdmin, async (_req, res) => {
  const apiKey = process.env["GOOGLE_PLACES_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "GOOGLE_PLACES_API_KEY not set" });
    return;
  }

  try {
    // Pull the existing churches once so we can dedupe in-memory.
    const existing = await db.select().from(churchesTable);

    // Map of place_id -> raw place to dedupe across queries.
    const seen = new Map<string, { place: PlaceTextSearchResult; city: string }>();

    for (const city of SYNC_CITIES) {
      for (const keyword of SYNC_KEYWORDS) {
        const query = `${keyword} in ${city}`;
        let pageToken: string | undefined;
        let pageCount = 0;
        // Up to 3 pages (60 results) per (city, keyword) tuple.
        do {
          const url = new URL(
            "https://maps.googleapis.com/maps/api/place/textsearch/json",
          );
          if (pageToken) {
            url.searchParams.set("pagetoken", pageToken);
          } else {
            url.searchParams.set("query", query);
            url.searchParams.set("region", "et");
          }
          url.searchParams.set("key", apiKey);

          // Google's pagetoken needs ~2s to become valid.
          if (pageToken) await sleep(2200);

          const r = await fetch(url.toString());
          const data = (await r.json()) as {
            status?: string;
            results?: PlaceTextSearchResult[];
            next_page_token?: string;
            error_message?: string;
          };

          if (data.status === "ZERO_RESULTS") break;
          if (data.status !== "OK") {
            // Stop the inner pagination loop on errors but keep sweeping.
            console.warn(
              `[sync-google-places] ${query} page ${pageCount} -> ${data.status}: ${data.error_message ?? ""}`,
            );
            break;
          }

          for (const place of data.results ?? []) {
            if (!place.place_id) continue;
            if (!place.geometry?.location) continue;
            // Quick orthodox-name filter to drop obvious false positives.
            const name = (place.name ?? "").toLowerCase();
            const isOrthodox =
              name.includes("orthodox") ||
              name.includes("tewahedo") ||
              name.includes("kidist") ||
              name.includes("kidus") ||
              name.includes("debre") ||
              name.includes("bete") ||
              name.includes("medhane") ||
              name.includes("maryam") ||
              name.includes("giyorgis") ||
              name.includes("mariam") ||
              name.includes("selassie");
            if (!isOrthodox) continue;
            seen.set(place.place_id, { place, city });
          }

          pageToken = data.next_page_token;
          pageCount += 1;
        } while (pageToken && pageCount < 3);
      }
    }

    let inserted = 0;
    let duplicates = 0;
    const inserts: Array<typeof churchesTable.$inferInsert> = [];

    // Dedupe vs existing rows by name + coordinate proximity, then queue
    // inserts after fetching place-details for phone/website/opening hours.
    for (const { place, city } of seen.values()) {
      const lat = place.geometry!.location!.lat;
      const lng = place.geometry!.location!.lng;
      const cleanName = place.name.trim().toLowerCase();

      const isDuplicate = existing.some((row: typeof churchesTable.$inferSelect) => {
        const sameName =
          row.name.trim().toLowerCase() === cleanName ||
          row.name.trim().toLowerCase().includes(cleanName) ||
          cleanName.includes(row.name.trim().toLowerCase());
        const close = distanceMeters({ lat, lng }, { lat: row.latitude, lng: row.longitude }) < 150;
        return sameName && close;
      });
      if (isDuplicate) {
        duplicates += 1;
        continue;
      }

      // Place Details for richer data (phone, website, hours).
      let phone = "";
      let website = "";
      let liturgyTimes = "";
      try {
        const detailsUrl = new URL(
          "https://maps.googleapis.com/maps/api/place/details/json",
        );
        detailsUrl.searchParams.set("place_id", place.place_id);
        detailsUrl.searchParams.set(
          "fields",
          "international_phone_number,formatted_phone_number,website,opening_hours",
        );
        detailsUrl.searchParams.set("key", apiKey);
        const dRes = await fetch(detailsUrl.toString());
        const details = (await dRes.json()) as PlaceDetailsResult;
        phone =
          details.result?.international_phone_number ??
          details.result?.formatted_phone_number ??
          "";
        website = details.result?.website ?? "";
        liturgyTimes =
          details.result?.opening_hours?.weekday_text?.join("; ") ?? "";
      } catch (err) {
        console.warn(`[sync-google-places] place-details failed for ${place.place_id}`, err);
      }

      const photoRef = place.photos?.[0]?.photo_reference;
      const imageUrl = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${apiKey}`
        : "https://images.unsplash.com/photo-1548625361-1d94651a28bf?w=800";

      inserts.push({
        name: place.name,
        city: city.split(",")[0]!.trim(),
        country: "Ethiopia",
        address: place.formatted_address ?? city,
        latitude: lat,
        longitude: lng,
        phone,
        website,
        priest: "",
        liturgyTimes,
        imageUrl,
        description: `Ethiopian Orthodox Tewahedo church located in ${place.formatted_address ?? city}.`,
      });
    }

    // Bulk insert in a single round-trip when we have new rows.
    if (inserts.length) {
      await db.insert(churchesTable).values(inserts);
      inserted = inserts.length;
    }

    res.json({
      ok: true,
      seen: seen.size,
      inserted,
      duplicates,
      existing_before: existing.length,
      cities: SYNC_CITIES.length,
      keywords: SYNC_KEYWORDS.length,
    });
  } catch (error) {
    console.error("[sync-google-places] failed", error);
    res
      .status(500)
      .json({ error: "Failed to sync churches", details: String(error) });
  }
});

export default router;
