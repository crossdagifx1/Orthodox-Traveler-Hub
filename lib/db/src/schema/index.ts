import {
  pgTable,
  text,
  serial,
  doublePrecision,
  boolean,
  integer,
  timestamp,
  numeric,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 32 }).notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type User = typeof usersTable.$inferSelect;

export const destinationsTable = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  country: text("country").notNull(),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  gallery: text("gallery").array().notNull().default([]),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  bestSeason: text("best_season").notNull().default(""),
  feastDay: text("feast_day").notNull().default(""),
  founded: text("founded").notNull().default(""),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Destination = typeof destinationsTable.$inferSelect;

export const churchesTable = pgTable("churches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  phone: text("phone").notNull().default(""),
  website: text("website").notNull().default(""),
  priest: text("priest").notNull().default(""),
  liturgyTimes: text("liturgy_times").notNull().default(""),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Church = typeof churchesTable.$inferSelect;

export const marketplaceItemsTable = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  sellerName: text("seller_name").notNull(),
  sellerLocation: text("seller_location").notNull().default(""),
  condition: text("condition").notNull().default("New"),
  inStock: boolean("in_stock").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type MarketplaceItem = typeof marketplaceItemsTable.$inferSelect;

export const mezmursTable = pgTable("mezmurs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  category: text("category").notNull(),
  language: varchar("language", { length: 64 }).notNull().default("Amharic"),
  duration: integer("duration").notNull().default(0),
  coverUrl: text("cover_url").notNull(),
  audioUrl: text("audio_url").notNull(),
  lyrics: text("lyrics").notNull().default(""),
  plays: integer("plays").notNull().default(0),
  isTrending: boolean("is_trending").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Mezmur = typeof mezmursTable.$inferSelect;

export const newsPostsTable = pgTable("news_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  coverUrl: text("cover_url").notNull(),
  readMinutes: integer("read_minutes").notNull().default(3),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
});
export type NewsPost = typeof newsPostsTable.$inferSelect;
