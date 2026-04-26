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
- Cookie-based session (`guzo_uid`, httpOnly).
- `POST /api/auth/login` with `{ email, name? }` creates the user if missing and sets the session cookie. No password — login is required only when a user takes an action (listing an item) or accesses the admin console.
- `GET /api/auth/me` returns the current user.
- `requireAuth` and `requireAdmin` middleware in `artifacts/api-server/src/lib/auth.ts`.
- Frontend admin routes are wrapped in `<AdminGuard>` and the dashboard checks role from `useGetCurrentUser`.
- The seeded superadmin is `admin@guzo.app` (name "Abune Guzo").

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
