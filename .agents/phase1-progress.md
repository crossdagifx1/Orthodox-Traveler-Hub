# Epic #1 — Identity, Social & Engagement: Phase 1 Progress

## Done in this session

### Database
- **`lib/db/src/schema/index.ts`**: Extended `usersTable` with `displayName`,
  `avatarUrl`, `bio`, `isPublic`. Added new tables:
  - `bookmarksTable` (composite-unique on user+target)
  - `badgesTable`, `userBadgesTable`
  - `streaksTable`
  - `commentsTable`, `commentLikesTable`
  - `reactionsTable`
  - `notificationsTable`
  - Exported `TARGET_TYPES`, `REACTION_KINDS` constants.
- **`lib/db/drizzle/0001_engagement.sql`**: New migration applying all of the
  above; idempotent (uses `IF NOT EXISTS`).
- **`lib/db/src/seed-badges.ts`**: Catalogue of 9 badges
  (`first_quiz`, `scholar`, `streak_3/7/30`, `pilgrim`, `hymn_lover`,
  `voice_in_the_choir`, `champion`).
- **`lib/db/src/index.ts`**: Refactored. New `bootstrap()` async function:
  - Applies all `*.sql` migrations to in-memory PGlite when no `DATABASE_URL`.
  - Tolerates "already exists" so it can be called repeatedly.
  - Seeds the admin user and the badge catalogue.
- **`artifacts/api-server/src/index.ts`**: Now `await bootstrap()` before
  `app.listen()`.

### Backend helpers (`artifacts/api-server/src/lib/`)
- **`streak.ts`**: `getStreak`, `bumpStreak` (UTC-day boundary), `addPoints`.
  Returns a `bumped` flag callers use to gate streak-badge evaluation.
- **`badges.ts`**: `awardBadge` (idempotent, also writes a notification),
  `evaluateStreakBadges`, `evaluateQuizBadges` (first/scholar/champion),
  `evaluateMezmurBadges`, `evaluateBookmarkBadges` (pilgrim/hymn_lover from
  bookmarks), `evaluateCommentBadges`.
- **`notifications.ts`**: `notify(userId, kind, title, body, link, metadata)`
  with safe error handling.

### New routes (`artifacts/api-server/src/routes/social.ts`)
~900 lines, ~16 endpoints:
- `GET /users/me`, `PATCH /users/me`
- `GET /users/:id` (public profile, gated by `isPublic`)
- `GET/POST/DELETE /me/bookmarks` (CRUD; awards bookmark badges; bumps streak)
- `GET /me/badges`
- `GET /me/streak`
- `GET /me/notifications`, `POST /me/notifications/read-all`,
  `POST /me/notifications/:id/read`
- `GET /comments`, `POST /comments` (1-level threading + per-user rate limit
  of 12/min), `PATCH /comments/:id`, `DELETE /comments/:id`
  (owner OR moderator+; mod actions audit-logged)
- `POST /comments/:id/like`, `DELETE /comments/:id/like` (notifies author)
- `POST /comments/:id/report` (audit-logged for moderation queue)
- `GET /reactions` (returns summary + user's own reactions),
  `POST /reactions`, `DELETE /reactions`

Wired into `routes/index.ts`.

### Hooks into existing flows
- **`routes/qa.ts /qa/attempts/:id/finish`**: After commit, asynchronously
  awards points, bumps streak, evaluates streak + quiz badges. Best-effort
  (failures don't roll back the attempt).

### Side fix
- **`artifacts/api-server/package.json`**: Added `@electric-sql/pglite` as a
  direct dep so pnpm dedupes `drizzle-orm` to a single virtual store path.
  Run `pnpm install` from the workspace root to apply. This will eliminate
  the ~2300 phantom typecheck errors caused by two `drizzle-orm` copies.

## Deferred to next session

### 1. OpenAPI spec + codegen (REQUIRED for Phase 2)
`lib/api-spec/openapi.yaml` needs ~600 lines of new schemas + paths covering
every endpoint in `routes/social.ts` plus the extended fields on `User`.
Suggested schema names:
- `MeProfile`, `PublicProfile`, `UpdateMeBody`
- `Bookmark`, `CreateBookmarkBody`
- `Badge`, `UserBadge`
- `Streak`
- `Notification`, `NotificationsPage`
- `Comment`, `CreateCommentBody`, `UpdateCommentBody`
- `ReactionsSummary`, `CreateReactionBody`
Then run `pnpm -C lib/api-spec codegen` to regenerate
`lib/api-client-react` and `lib/api-zod`.

### 2. Phase 2 — Profile pages + bookmark integration
- `/me` private profile (tabs: Overview / History / Saved / Comments / Badges)
- `/u/:id` public profile + leaderboard rows linking to it
- Replace `WishlistProvider` (currently localStorage) with API-backed
  bookmarks, surfaced on `/me?tab=saved`. Update heart buttons on
  `Destinations`, `Churches`, `Mezmurs`, `News`, `Marketplace` detail pages.

### 3. Phase 3 — Streak chip + Notifications bell + Badge display
- "Day N 🔥" pill on the floating cluster (`FloatingControls.tsx`)
- Streak chip on `Home.tsx` and Learn list header
- Notifications bell with unread count, dropdown sheet, mark-as-read

### 4. Phase 4 — Comments + Reactions UI
- Reusable `<CommentList>` + `<CommentComposer>` on `NewsDetail` and
  `QuizDetail` (post-attempt only for quizzes — Epic #3 dependency)
- Reaction bar (`❤ 🙏 ✝ 👍`) on `NewsDetail` and `MezmurDetail`

### 5. Phase 5 — SEO + i18n
- Install `react-helmet-async`, build `<PageMeta>` helper
- Per-detail-page meta + OG/Twitter tags driven by the resource
- Static `/sitemap.xml` from public content (api-server route)
- All new i18n strings into `am.json` + `en.json`

## How to resume

```powershell
# 1. Dedupe drizzle-orm
pnpm install

# 2. Boot api-server to verify Phase 1 backend
$env:PORT = "8080"
$env:SESSION_SECRET = "guzo-dev-secret-key-2026"
pnpm --filter "@workspace/api-server" run dev

# 3. Smoke-test the new endpoints
curl http://localhost:8080/api/healthz
# (Login first, then) curl with cookie:
curl http://localhost:8080/api/me/streak

# 4. Continue with Phase 1 step 6 (OpenAPI) before any UI work.
```
