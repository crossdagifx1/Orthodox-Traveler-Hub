CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"actor_email" varchar(255) DEFAULT '' NOT NULL,
	"actor_role" varchar(32) DEFAULT '' NOT NULL,
	"action" varchar(64) NOT NULL,
	"target_type" varchar(64) DEFAULT '' NOT NULL,
	"target_id" varchar(64) DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" varchar(64) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "churches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"address" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"priest" text DEFAULT '' NOT NULL,
	"liturgy_times" text DEFAULT '' NOT NULL,
	"image_url" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"country" text NOT NULL,
	"short_description" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"gallery" text[] DEFAULT '{}' NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"best_season" text DEFAULT '' NOT NULL,
	"feast_day" text DEFAULT '' NOT NULL,
	"founded" text DEFAULT '' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" varchar(8) DEFAULT 'USD' NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"seller_name" text NOT NULL,
	"seller_location" text DEFAULT '' NOT NULL,
	"condition" text DEFAULT 'New' NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mezmurs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"category" text NOT NULL,
	"language" varchar(64) DEFAULT 'Amharic' NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"cover_url" text NOT NULL,
	"audio_url" text NOT NULL,
	"lyrics" text DEFAULT '' NOT NULL,
	"plays" integer DEFAULT 0 NOT NULL,
	"is_trending" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"author" text NOT NULL,
	"cover_url" text NOT NULL,
	"read_minutes" integer DEFAULT 3 NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"response" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"time_spent_ms" integer DEFAULT 0 NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"user_name" varchar(255) DEFAULT '' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quiz_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" varchar(16) DEFAULT 'weekly' NOT NULL,
	"quiz_id" integer NOT NULL,
	"prize" text DEFAULT '' NOT NULL,
	"banner_url" text DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"type" varchar(16) DEFAULT 'mcq' NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correct_answer" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"explanation" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(16) NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" varchar(64) DEFAULT 'general' NOT NULL,
	"difficulty" varchar(16) DEFAULT 'easy' NOT NULL,
	"language" varchar(8) DEFAULT 'en' NOT NULL,
	"time_limit_seconds" integer DEFAULT 0 NOT NULL,
	"points_total" integer DEFAULT 0 NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"author_id" integer,
	"author_name" varchar(255) DEFAULT '' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"status" varchar(16) DEFAULT 'published' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quizzes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) DEFAULT '' NOT NULL,
	"role" varchar(32) DEFAULT 'user' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"suspended_until" timestamp with time zone,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_answers_attempt_question_uniq" ON "quiz_answers" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_idx" ON "quiz_attempts" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "quiz_attempts_leaderboard_idx" ON "quiz_attempts" USING btree ("status","finished_at");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_idx" ON "quiz_attempts" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_quiz_pos_idx" ON "quiz_questions" USING btree ("quiz_id","position");