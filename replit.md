# Guzo - Orthodox Christian Platform

A mobile-first web application for the Orthodox Christian community, with a special focus on Ethiopian Orthodox Tewahedo heritage. The site renders inside a phone-shell on desktop and as a full mobile experience on phones.

## Features

- **Home** — hero, stats, and featured destinations
- **Destinations** — pilgrimage sites and holy places with rich detail pages
- **Map** — interactive world map of Orthodox churches (Leaflet)
- **Marketplace** — icons, crosses, vestments, books, liturgical goods
- **Mezmurs** — spiritual hymns library with audio player and lyrics
- **News** — articles, teachings, and announcements
- **Admin Console** — separate management pages for each feature, gated by role

## Architecture

This is a pnpm monorepo with two artifacts and a shared library layer.

### Artifacts
- `artifacts/guzo` — React + Vite web app served at `/` (port 25436). Mobile-first, phone-shell layout, Tailwind, wouter routing.
- `artifacts/api-server` — Express + drizzle-orm backend at `/api` (port 8080). Cookie-based session auth.
- `artifacts/mockup-sandbox` — design preview iframe server (not used for production).

### Shared libs
- `lib/api-spec` — OpenAPI 3.1 contract (`openapi.yaml`)
- `lib/api-zod` — Zod schemas generated from OpenAPI
- `lib/api-client-react` — React Query hooks generated from OpenAPI; `customFetch` ships with `credentials: "include"` so the session cookie is always sent
- `lib/db` — drizzle-orm schema + Postgres client (`schema/index.ts`)

### Database
PostgreSQL (DATABASE_URL). Tables:
- `users` (email, name, role: user/admin/superadmin)
- `destinations`, `churches`, `marketplace_items`, `mezmurs`, `news_posts`

Schema changes are pushed via `pnpm --filter @workspace/db run db:push`.

### Auth model
- Cookie-based session (`guzo_sid`, httpOnly, HMAC-signed with `SESSION_SECRET`). Token format: `<userId>.<issuedAtMs>.<base64url-sig>`. 30-day max age. Forged or tampered cookies are rejected with `timingSafeEqual`. `SESSION_SECRET` is **required** at startup (server refuses to boot without it).
- `POST /api/auth/login` with `{ email, password, name? }`:
  - **Existing account:** verifies password against bcrypt-hashed `password_hash`. Returns 401 on mismatch.
  - **New email:** creates the account with the given password (sign-up = first login).
  - **Legacy account with empty `password_hash`:** returns 401. No auto-claim — accounts that have never set a password cannot be taken over by anyone who knows the email.
- `GET /api/auth/me` returns the current user (or `{user: null}`).
- `requireAuth` and `requireAdmin` middleware in `artifacts/api-server/src/lib/auth.ts`.
- Frontend admin routes are wrapped in `<AdminGuard>` and the dashboard checks role from `useGetCurrentUser`.
- The seeded superadmin is `admin@guzo.app` / password `guzo-admin-2026` (name "Abune Guzo").

### Internationalization (i18n)
- `react-i18next` with two languages: Amharic (`am`) and English (`en`). **Amharic is the default** for first-time visitors.
- Locale files: `artifacts/guzo/src/i18n/locales/am.json` and `en.json`.
- Persistence key: `guzo-lang-v2` in localStorage; the language switcher in the top bar toggles between the two.

### Providers (Guzo app)
The provider chain in `artifacts/guzo/src/App.tsx` is:
`QueryClientProvider > SettingsProvider > EthiopianCalendarProvider > AuthProvider > WishlistProvider > TooltipProvider > PlayerProvider > Router > AppRoutes + GlobalLoginDialog`.

- `SettingsProvider` — language, theme (light/dark/auto), font size, calendar (ethiopian/gregorian); all persisted to localStorage.
- `EthiopianCalendarProvider` — converts current Gregorian date to Ethiopian, exposes today's saint(s) and fasting key.
- `AuthProvider` — wraps `useGetCurrentUser`/`useLogout`; exposes `openLogin(reason?)` / `closeLogin()` so any component can summon the global login dialog.
- `WishlistProvider` — set of marketplace item IDs persisted to localStorage.
- `PlayerProvider` — current track + `playTrack` / `pauseTrack` / `resumeTrack` / `togglePlayPause`.

## Common Tasks

```bash
# Type check everything
pnpm -w run typecheck:libs
pnpm --filter @workspace/api-server run typecheck

# OpenAPI -> zod + react hooks codegen
pnpm --filter @workspace/api-spec run codegen

# Push DB schema
pnpm --filter @workspace/db run db:push

# After editing api-server source, the dev workflow auto-rebuilds.
```

## Notes
- All resource IDs are serialized as strings to match the OpenAPI contract (DB uses serial integers).
- Marketplace `price` is stored as numeric and serialized as `number`.
- News slug is auto-generated from title at insert time.
- Map uses `react-leaflet` + OpenStreetMap tiles.
