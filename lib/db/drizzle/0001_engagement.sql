-- Engagement / Social schema additions: profile fields, bookmarks, badges,
-- streaks, comments, comment_likes, reactions, notifications.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "display_name" varchar(255) DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "avatar_url" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "bio" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "bookmarks" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "target_type" varchar(32) NOT NULL,
  "target_id" varchar(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bookmarks_user_target_uniq"
  ON "bookmarks" USING btree ("user_id","target_type","target_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookmarks_user_idx"
  ON "bookmarks" USING btree ("user_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "badges" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" varchar(64) NOT NULL,
  "name" varchar(128) NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "icon_key" varchar(64) DEFAULT 'award' NOT NULL,
  "tier" varchar(16) DEFAULT 'bronze' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "badges_key_unique" UNIQUE("key")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_badges" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "badge_id" integer NOT NULL,
  "awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_badges_user_badge_uniq"
  ON "user_badges" USING btree ("user_id","badge_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_badges_user_idx"
  ON "user_badges" USING btree ("user_id","awarded_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "streaks" (
  "user_id" integer PRIMARY KEY NOT NULL,
  "current_streak" integer DEFAULT 0 NOT NULL,
  "longest_streak" integer DEFAULT 0 NOT NULL,
  "total_points" integer DEFAULT 0 NOT NULL,
  "last_active_date" varchar(16) DEFAULT '' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "comments" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "user_name" varchar(255) DEFAULT '' NOT NULL,
  "user_avatar_url" text DEFAULT '' NOT NULL,
  "target_type" varchar(32) NOT NULL,
  "target_id" varchar(64) NOT NULL,
  "parent_id" integer,
  "body" text NOT NULL,
  "likes_count" integer DEFAULT 0 NOT NULL,
  "status" varchar(16) DEFAULT 'visible' NOT NULL,
  "reports_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_target_idx"
  ON "comments" USING btree ("target_type","target_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_user_idx"
  ON "comments" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_parent_idx"
  ON "comments" USING btree ("parent_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "comment_likes" (
  "id" serial PRIMARY KEY NOT NULL,
  "comment_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "comment_likes_comment_user_uniq"
  ON "comment_likes" USING btree ("comment_id","user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "reactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "target_type" varchar(32) NOT NULL,
  "target_id" varchar(64) NOT NULL,
  "kind" varchar(16) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reactions_user_target_kind_uniq"
  ON "reactions" USING btree ("user_id","target_type","target_id","kind");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reactions_target_idx"
  ON "reactions" USING btree ("target_type","target_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "kind" varchar(32) NOT NULL,
  "title" text NOT NULL,
  "body" text DEFAULT '' NOT NULL,
  "link" text DEFAULT '' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_read" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx"
  ON "notifications" USING btree ("user_id","is_read","created_at");
