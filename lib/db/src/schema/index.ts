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
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull().default(""),
  role: varchar("role", { length: 32 }).notNull().default("user"),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  suspendedUntil: timestamp("suspended_until", { withTimezone: true }),
  notes: text("notes").notNull().default(""),
  /** Public display name (overrides `name` on profile/leaderboard if set). */
  displayName: varchar("display_name", { length: 255 }).notNull().default(""),
  /** Avatar URL — uploaded image or external URL. */
  avatarUrl: text("avatar_url").notNull().default(""),
  /** Short bio shown on the public profile. */
  bio: text("bio").notNull().default(""),
  /** When false, /u/:id returns 404; the user only appears in private contexts. */
  isPublic: boolean("is_public").notNull().default(true),
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

/**
 * Append-only audit log of every privileged action taken by an admin /
 * super-admin / moderator. Read-only from the UI; writes happen via the
 * `recordAudit()` helper in api-server. metadata is freeform JSON.
 */
export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id"),
  actorEmail: varchar("actor_email", { length: 255 }).notNull().default(""),
  actorRole: varchar("actor_role", { length: 32 }).notNull().default(""),
  action: varchar("action", { length: 64 }).notNull(),
  targetType: varchar("target_type", { length: 64 }).notNull().default(""),
  targetId: varchar("target_id", { length: 64 }).notNull().default(""),
  metadata: jsonb("metadata").notNull().default({}),
  ip: varchar("ip", { length: 64 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type AuditLog = typeof auditLogTable.$inferSelect;

/**
 * Key-value system settings, only writable by super-admins.
 * Values are JSON for flexibility (string, number, bool, object).
 */
export const systemSettingsTable = pgTable("system_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: jsonb("value").notNull().default({}),
  description: text("description").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by"),
});
export type SystemSetting = typeof systemSettingsTable.$inferSelect;

/**
 * ───────────────────────────── Q&A / LEARN ─────────────────────────────
 * A full quiz / Q&A platform: teachers (moderator+) author quizzes; users
 * take attempts; scores feed weekly / monthly / all-time leaderboards;
 * challenges spotlight a quiz for a window of time; quizzes can be joined
 * by a short alphanumeric `code`.
 */
export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  /** Short, human-shareable code (6-8 chars, A–Z / 0–9). Unique. */
  code: varchar("code", { length: 16 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 64 }).notNull().default("general"),
  difficulty: varchar("difficulty", { length: 16 }).notNull().default("easy"),
  language: varchar("language", { length: 8 }).notNull().default("en"),
  /** 0 = no time limit; otherwise total seconds for the whole quiz. */
  timeLimitSeconds: integer("time_limit_seconds").notNull().default(0),
  /** Cached sum of question points; updated on question CRUD. */
  pointsTotal: integer("points_total").notNull().default(0),
  /** Cached count of attempts (status='completed'). */
  attemptsCount: integer("attempts_count").notNull().default(0),
  coverUrl: text("cover_url").notNull().default(""),
  authorId: integer("author_id"),
  authorName: varchar("author_name", { length: 255 }).notNull().default(""),
  isPublic: boolean("is_public").notNull().default(true),
  /** 'draft' | 'published' | 'archived' */
  status: varchar("status", { length: 16 }).notNull().default("published"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Quiz = typeof quizzesTable.$inferSelect;

/**
 * One question of a quiz. `type` controls how `options` and `correctAnswer`
 * are interpreted (see backend validators):
 *   - 'mcq'        single correct: options=[{id,text}], correctAnswer=string id
 *   - 'multi'      multiple correct: same options, correctAnswer=string[] of ids
 *   - 'truefalse'  correctAnswer="true" | "false"
 *   - 'short'      free text: correctAnswer=string (case-insensitive)
 *   - 'fill'       options=[{blanks:n}] correctAnswer=string[] per blank
 *   - 'ordering'   options=[{id,text}] correctAnswer=string[] (ids in order)
 */
export const quizQuestionsTable = pgTable(
  "quiz_questions",
  {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id").notNull(),
    type: varchar("type", { length: 16 }).notNull().default("mcq"),
    prompt: text("prompt").notNull(),
    options: jsonb("options").notNull().default([]),
    correctAnswer: jsonb("correct_answer").notNull().default({}),
    explanation: text("explanation").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    points: integer("points").notNull().default(10),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    quizPosIdx: index("quiz_questions_quiz_pos_idx").on(t.quizId, t.position),
  }),
);
export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;

/**
 * One user's attempt at a quiz. While in_progress, the score/correct counts
 * are partial; on /finish, they're final. Multiple attempts per (user,quiz)
 * are allowed — leaderboard takes best.
 */
export const quizAttemptsTable = pgTable(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id").notNull(),
    userId: integer("user_id").notNull(),
    userName: varchar("user_name", { length: 255 }).notNull().default(""),
    score: integer("score").notNull().default(0),
    totalPoints: integer("total_points").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    totalCount: integer("total_count").notNull().default(0),
    durationMs: integer("duration_ms").notNull().default(0),
    /** 'in_progress' | 'completed' | 'abandoned' */
    status: varchar("status", { length: 16 }).notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("quiz_attempts_user_idx").on(t.userId, t.startedAt),
    leaderboardIdx: index("quiz_attempts_leaderboard_idx").on(t.status, t.finishedAt),
    quizIdx: index("quiz_attempts_quiz_idx").on(t.quizId),
  }),
);
export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;

/** One submitted answer in an attempt. */
export const quizAnswersTable = pgTable(
  "quiz_answers",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id").notNull(),
    questionId: integer("question_id").notNull(),
    response: jsonb("response").notNull().default({}),
    isCorrect: boolean("is_correct").notNull().default(false),
    pointsEarned: integer("points_earned").notNull().default(0),
    timeSpentMs: integer("time_spent_ms").notNull().default(0),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Critical: enforces one answer row per (attempt, question) so concurrent
    // submissions can't double-count and so onConflictDoUpdate is safe.
    attemptQuestionUniq: uniqueIndex("quiz_answers_attempt_question_uniq").on(
      t.attemptId,
      t.questionId,
    ),
  }),
);
export type QuizAnswer = typeof quizAnswersTable.$inferSelect;

/**
 * A challenge spotlights a quiz for a window of time and pairs it with a
 * mini-leaderboard / prize. Type indicates the cadence.
 */
export const quizChallengesTable = pgTable("quiz_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  /** 'weekly' | 'monthly' | 'flash' | 'custom' */
  type: varchar("type", { length: 16 }).notNull().default("weekly"),
  quizId: integer("quiz_id").notNull(),
  prize: text("prize").notNull().default(""),
  bannerUrl: text("banner_url").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type QuizChallenge = typeof quizChallengesTable.$inferSelect;

/**
 * ──────────────────────── ENGAGEMENT / SOCIAL ─────────────────────────
 * Bookmarks, badges, streaks, comments, reactions, notifications.
 *
 * `target_type` is a stable string discriminator across these tables
 * (e.g. 'destination' | 'church' | 'mezmur' | 'news' | 'marketplace' | 'quiz').
 */

export const TARGET_TYPES = [
  "destination",
  "church",
  "mezmur",
  "news",
  "marketplace",
  "quiz",
] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

/** Saved / hearted items. One row per (user, target_type, target_id). */
export const bookmarksTable = pgTable(
  "bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    targetType: varchar("target_type", { length: 32 }).notNull(),
    targetId: varchar("target_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("bookmarks_user_target_uniq").on(
      t.userId,
      t.targetType,
      t.targetId,
    ),
    userIdx: index("bookmarks_user_idx").on(t.userId, t.createdAt),
  }),
);
export type Bookmark = typeof bookmarksTable.$inferSelect;

/**
 * Catalogue of all possible badges. Seeded by `init.ts`. `key` is the
 * stable identifier referenced by the awarding helpers
 * (e.g. 'first_quiz', 'streak_7', 'pilgrim', 'scholar', 'hymn_lover').
 */
export const badgesTable = pgTable("badges", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description").notNull().default(""),
  /** Icon name in our lucide / custom icon set; e.g. 'flame', 'crown'. */
  iconKey: varchar("icon_key", { length: 64 }).notNull().default("award"),
  /** Cosmetic tier: 'bronze' | 'silver' | 'gold' | 'special'. */
  tier: varchar("tier", { length: 16 }).notNull().default("bronze"),
  /** Higher numbers sort earlier on the profile. */
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Badge = typeof badgesTable.$inferSelect;

/** Awarded-badges junction. One row per (user, badge). */
export const userBadgesTable = pgTable(
  "user_badges",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    badgeId: integer("badge_id").notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("user_badges_user_badge_uniq").on(t.userId, t.badgeId),
    userIdx: index("user_badges_user_idx").on(t.userId, t.awardedAt),
  }),
);
export type UserBadge = typeof userBadgesTable.$inferSelect;

/**
 * Daily-activity streaks. One row per user. `lastActiveDate` is the
 * Ethiopian-calendar date string (YYYY-MM-DD in Ethiopian) on which
 * the user last performed any authenticated mutation.
 */
export const streaksTable = pgTable("streaks", {
  userId: integer("user_id").primaryKey(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  /** YYYY-MM-DD in the Ethiopian calendar. */
  lastActiveDate: varchar("last_active_date", { length: 16 }).notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Streak = typeof streaksTable.$inferSelect;

/**
 * Threaded comments (1 level deep). `parentId` null = top-level; otherwise
 * points at another comment with the same target_type+target_id.
 * `status`: 'visible' | 'hidden' | 'deleted'.
 */
export const commentsTable = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    userName: varchar("user_name", { length: 255 }).notNull().default(""),
    userAvatarUrl: text("user_avatar_url").notNull().default(""),
    targetType: varchar("target_type", { length: 32 }).notNull(),
    targetId: varchar("target_id", { length: 64 }).notNull(),
    parentId: integer("parent_id"),
    body: text("body").notNull(),
    likesCount: integer("likes_count").notNull().default(0),
    status: varchar("status", { length: 16 }).notNull().default("visible"),
    /** When non-zero, count of pending un-resolved reports. */
    reportsCount: integer("reports_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    targetIdx: index("comments_target_idx").on(t.targetType, t.targetId, t.createdAt),
    userIdx: index("comments_user_idx").on(t.userId, t.createdAt),
    parentIdx: index("comments_parent_idx").on(t.parentId),
  }),
);
export type Comment = typeof commentsTable.$inferSelect;

/** Per-user "like" on a comment. One row per (comment, user). */
export const commentLikesTable = pgTable(
  "comment_likes",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id").notNull(),
    userId: integer("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("comment_likes_comment_user_uniq").on(
      t.commentId,
      t.userId,
    ),
  }),
);
export type CommentLike = typeof commentLikesTable.$inferSelect;

/**
 * Emoji reactions on news posts and mezmurs.
 * `kind`: 'heart' | 'pray' | 'cross' | 'thumb'.
 * One row per (user, target_type, target_id, kind) — a user may apply
 * multiple distinct reactions on the same target.
 */
export const REACTION_KINDS = ["heart", "pray", "cross", "thumb"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

export const reactionsTable = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    targetType: varchar("target_type", { length: 32 }).notNull(),
    targetId: varchar("target_id", { length: 64 }).notNull(),
    kind: varchar("kind", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("reactions_user_target_kind_uniq").on(
      t.userId,
      t.targetType,
      t.targetId,
      t.kind,
    ),
    targetIdx: index("reactions_target_idx").on(t.targetType, t.targetId),
  }),
);
export type Reaction = typeof reactionsTable.$inferSelect;

/**
 * In-app notifications. `kind` examples:
 *   'badge_awarded' | 'comment_reply' | 'comment_liked' |
 *   'challenge_new' | 'account_status'.
 */
export const notificationsTable = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    kind: varchar("kind", { length: 32 }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    /** Optional in-app deep-link path. */
    link: text("link").notNull().default(""),
    /** Free-form metadata (badgeId, commentId, etc.). */
    metadata: jsonb("metadata").notNull().default({}),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId, t.isRead, t.createdAt),
  }),
);
export type Notification = typeof notificationsTable.$inferSelect;
