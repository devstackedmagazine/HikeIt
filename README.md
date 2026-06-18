# HikeIt

Hiking club management SaaS for Kosovo. Hikers discover trails, join club trips,
and get weather alerts; clubs manage members, organize trips, and (optionally)
collect payments.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + React 19, TypeScript strict
- **Drizzle ORM** + PostgreSQL (Supabase)
- **Better Auth** (email/password, verification, password reset)
- **Tailwind CSS v4** + shadcn/ui (base-nova)
- **Leaflet** + OpenStreetMap (maps), **Open-Meteo** (weather, no API key)
- **Resend** (email) + React Email
- **Cloudflare R2** (avatars, GPX, photos)
- **Stripe** (club subscriptions + Connect foundation)
- **recharts** (elevation charts), **nuqs** (URL filters), **cmdk** (search)

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in the values below
pnpm db:push                 # push schema to your database
pnpm db:seed                 # seed trails, clubs, demo trips
pnpm dev
```

### Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Supabase pooled / direct connection |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | Auth |
| `NEXT_PUBLIC_APP_URL` | App base URL |

### Optional (features degrade gracefully when unset)

| Variable | Enables |
| --- | --- |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |
| `R2_*` | Avatar / GPX / photo uploads |
| `CRON_SECRET` | Protects `/api/cron/*` endpoints |
| `STRIPE_*` (+ price IDs) | Club subscriptions & payments |

Weather (Open-Meteo) and maps (OpenStreetMap) need **no keys**.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm db:push` / `db:seed` / `db:studio` | Drizzle schema / seed / studio |

## Cron jobs

`vercel.json` schedules `/api/cron/weather-check` (every 3h) and
`/api/cron/trip-reminders` (daily). Both require the `Authorization: Bearer
$CRON_SECRET` header.

## Deployment

Deployed on Vercel with a Supabase production database. See the next session's
deployment runbook for prod env vars, DNS, and email verification.

## Roadmap (Phase 2)

- Service worker + offline trail caching (PWA today is install-only)
- Full Stripe Connect onboarding + paid trip checkout
- Postgres full-text search (currently `ilike`)
- Trip photos upload, super-admin trail verification UI
