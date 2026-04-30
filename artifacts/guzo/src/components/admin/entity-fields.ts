import type { EntityField } from "./EntityFormSheet";

/**
 * Field definitions per entity, mirroring the OpenAPI Create*Body schemas in
 * lib/api-zod. Keep these in sync when the spec changes (regen + edit here).
 */

export const DESTINATION_FIELDS: EntityField[] = [
  { key: "name", label: "Name", required: true, placeholder: "Lalibela" },
  { key: "region", label: "Region", required: true, placeholder: "Amhara" },
  { key: "country", label: "Country", required: true, placeholder: "Ethiopia" },
  {
    key: "shortDescription",
    label: "Short description",
    required: true,
    placeholder: "One-sentence summary",
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: true,
  },
  {
    key: "imageUrl",
    label: "Cover image URL",
    type: "url",
    required: true,
    placeholder: "https://…",
  },
  { key: "latitude", label: "Latitude", type: "number", required: true },
  { key: "longitude", label: "Longitude", type: "number", required: true },
  { key: "bestSeason", label: "Best season" },
  { key: "feastDay", label: "Feast day" },
  { key: "founded", label: "Founded" },
  { key: "isFeatured", label: "Featured", type: "checkbox" },
];

export const CHURCH_FIELDS: EntityField[] = [
  { key: "name", label: "Name", required: true },
  { key: "city", label: "City", required: true },
  { key: "country", label: "Country", required: true },
  { key: "address", label: "Address", required: true },
  { key: "latitude", label: "Latitude", type: "number", required: true },
  { key: "longitude", label: "Longitude", type: "number", required: true },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website", type: "url" },
  { key: "priest", label: "Priest" },
  { key: "liturgyTimes", label: "Liturgy times" },
  { key: "imageUrl", label: "Image URL", type: "url", required: true },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: true,
  },
];

export const MEZMUR_FIELDS: EntityField[] = [
  { key: "title", label: "Title", required: true },
  { key: "artist", label: "Artist", required: true },
  { key: "category", label: "Category", required: true, placeholder: "praise / fasting / feast" },
  { key: "language", label: "Language", required: true, placeholder: "Amharic / Ge'ez" },
  { key: "duration", label: "Duration (seconds)", type: "number", required: true },
  { key: "coverUrl", label: "Cover image URL", type: "url", required: true },
  { key: "audioUrl", label: "Audio URL", type: "url", required: true },
  { key: "lyrics", label: "Lyrics", type: "textarea" },
  { key: "isTrending", label: "Trending", type: "checkbox" },
];

export const NEWS_FIELDS: EntityField[] = [
  { key: "title", label: "Title", required: true },
  { key: "excerpt", label: "Excerpt", required: true },
  { key: "content", label: "Content", type: "textarea", required: true },
  { key: "category", label: "Category", required: true },
  { key: "author", label: "Author", required: true },
  { key: "coverUrl", label: "Cover image URL", type: "url", required: true },
  { key: "readMinutes", label: "Read time (minutes)", type: "number" },
];

export const MARKETPLACE_FIELDS: EntityField[] = [
  { key: "title", label: "Title", required: true },
  { key: "category", label: "Category", required: true },
  { key: "price", label: "Price", type: "number", required: true },
  { key: "currency", label: "Currency", placeholder: "ETB / USD" },
  { key: "description", label: "Description", type: "textarea", required: true },
  { key: "imageUrl", label: "Image URL", type: "url", required: true },
  { key: "sellerName", label: "Seller name", required: true },
  { key: "sellerLocation", label: "Seller location" },
  { key: "condition", label: "Condition", placeholder: "new / used / vintage" },
  { key: "inStock", label: "In stock", type: "checkbox", defaultValue: true },
  { key: "isFeatured", label: "Featured", type: "checkbox" },
];
