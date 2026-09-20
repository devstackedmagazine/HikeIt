# HikeIt — Complete Product & Engineering Roadmap

> **Status:** LIVE IN PRODUCTION at hikeit.app
> **Owner:** Fatlum (solo founder + developer, Kosovo)
> **Domain:** hikeit.app (bought on name.com via GitHub Student Pack)
> **GitHub:** github.com/devstackedmagazine/HikeIt.git
> **Branch strategy:** feat/* branches → merge to main → Vercel auto-deploys
> **Market:** Kosovo first → Balkans expansion
> **Budget:** €0/month (all free tiers)
> **Developer level:** Junior full-stack, building with senior practices
> **Node:** v22.20.0 | pnpm 11.7.0 | Linux (Ubuntu)
> **Claude usage:** Opus 4.6/4.8 for complex tasks, Sonnet 4.6 for UI/simple fixes

---

## CURRENT STATE — FULLY BUILT & DEPLOYED

HikeIt is a complete, production-ready SaaS application. Everything below has been built, tested, and deployed. This is NOT a planning doc — it's a live product description.

---

## TECH STACK (FINAL — DO NOT CHANGE)

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16, App Router | TypeScript strict, Turbopack |
| Styling | Tailwind CSS v4 | Custom design system |
| Components | shadcn/ui (base-nova) | All overridden to Alpine Brutalism design |
| Database | PostgreSQL on Supabase (Frankfurt, EU) | Drizzle ORM |
| Auth | Better Auth (self-hosted) | Email/password + Google OAuth |
| Images | Cloudinary | Security-grade upload system |
| Maps | Leaflet + OpenStreetMap → Thunderforest Outdoors | Free, domain-restricted API key |
| Weather | Open-Meteo | No API key needed, 10K calls/day |
| Email | Resend | Verified domain hello@hikeit.app |
| Payments | Paddle (Merchant of Record) | Club subscriptions only — HikeIt does not process trip money |
| Hosting | Vercel | Free hobby tier, hikeit.app connected |
| Error monitoring | Sentry | DSN: https://abe1c49dc80956b85e063a4595e22806@o4511733984067584.ingest.de.sentry.io/4511734018080848, Org: hikeit-kosovo, Project: javascript-nextjs, EU data residency |
| SEO | Next.js metadata API + JSON-LD | Google Search Console verified |
| Package manager | pnpm | Always use pnpm, never npm |

### Stack decisions locked — never change these:
- Supabase over Firebase (relational data, free 500MB, SQL)
- Better Auth over Clerk (self-hosted, no vendor lock-in)
- Leaflet+Thunderforest over Mapbox (no credit card, better hiking tiles)
- Open-Meteo over OpenWeatherMap (no API key, completely free)
- Cloudinary over R2 (auto optimization, no card for free tier)
- pnpm over npm/yarn (faster, disk efficient)
- Server Components by default, 'use client' only when needed
- nuqs for URL-persisted filter state (shareable, back-button friendly)

---

## DESIGN SYSTEM — "ALPINE BRUTALISM"

This is the ONLY design system for HikeIt. Every component follows these rules exactly.

### Core Rules
- **ZERO border radius** everywhere — all corners are perfectly sharp 90 degrees
- **No pure white** (#FFFFFF) — always use Summit (#FAFFF9)
- **No pure black** (#000000) — always use Abyss (#0D1F14)
- **All buttons uppercase**, font-weight 700, letter-spacing 0.06em
- **All section headers uppercase**, small size, Moss colored, wide letter-spacing
- **2px solid borders** — structural, not decorative hairlines
- **Active nav items** = solid Moss (#4CAF7D) fill block (not underline)

### Colors (EXACT HEX — NEVER APPROXIMATE)
```
Abyss (near-black green):  #0D1F14  — dark backgrounds, dashboard sidebar
Forest (primary):          #1A3D2B  — primary buttons, borders, headlines on light
Pine (mid green):          #2D5F3F  — secondary accents, gradients
Moss (bright green):       #4CAF7D  — CTAs on dark, success states, active nav
Mist (pale green-white):   #E8F5ED  — secondary light backgrounds, hover states
Summit (off-white):        #FAFFF9  — primary light background, card backgrounds
Sunset (orange):           #E87A30  — revenue/money figures, warm CTAs
Danger (red):              #C0392B  — errors, expert difficulty, cancel actions
Alert (amber):             #F5A623  — warnings, moderate difficulty
```

### Color Usage Rules
- Dark backgrounds (sections, sidebar): Abyss or Forest
- Light backgrounds (content, cards): Summit or Mist
- Primary CTA: bg-forest text-summit
- Moss CTA: bg-moss text-abyss (high contrast)
- **Money/revenue values: ALWAYS Sunset color**
- Success/verified: Moss color
- Warnings: Alert (#F5A623)
- Errors/danger: Danger (#C0392B)

### Typography
```
Headings: Sora, weight 900 (black), UPPERCASE, letter-spacing -0.03em to -0.04em
Body text: Inter, weight 400, normal case, line-height 1.6
Labels/buttons/badges: Inter or Sora weight 700-800, UPPERCASE, letter-spacing 0.06-0.15em
Stat numbers: Sora weight 900, large size
```

### Layout Patterns
```tsx
// Section pattern
<section className="py-20 bg-summit">
  <div className="max-w-7xl mx-auto px-6">
    <p className="text-xs font-bold uppercase tracking-[0.15em] text-moss mb-3">SECTION LABEL</p>
    <h2 className="font-heading text-4xl font-black uppercase tracking-tight text-forest">HEADLINE</h2>
  </div>
</section>

// Card pattern
<div className="border-2 border-forest bg-summit">
  <div className="border-b-2 border-forest p-5">
    <h3 className="font-heading font-black uppercase tracking-tight text-forest text-lg">CARD TITLE</h3>
  </div>
  <div className="p-5">{/* content */}</div>
</div>

// Dark section pattern
<section className="py-20 bg-abyss border-y-2 border-forest">
  {/* Summit white text on dark background */}
</section>
```

---

## INFRASTRUCTURE

### Production Environment
```
Live URL:           https://hikeit.app
Vercel project:     HikeIt (connected to GitHub main branch)
Vercel URL:         https://hikeitapp.vercel.app (preview)
Database:           Supabase prod project (Frankfurt)
Nameservers:        ns1.vercel-dns.com + ns2.vercel-dns.com (set at name.com)
Email from:         hello@hikeit.app (Resend, DNS verified)
```

### Critical Environment Variables (Vercel Production)
```bash
NEXT_PUBLIC_APP_URL=https://hikeit.app
BETTER_AUTH_URL=https://hikeit.app
BETTER_AUTH_SECRET=[production secret — different from dev]
DATABASE_URL=[Supabase production transaction pooler URL]
DIRECT_URL=[Supabase production direct connection URL]
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=[cloud name]
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=hikeit_uploads
CLOUDINARY_API_KEY=[key]
CLOUDINARY_API_SECRET=[secret]
RESEND_API_KEY=[key]
EMAIL_FROM=hello@hikeit.app
GOOGLE_CLIENT_ID=171813834814-vgqd7va5n4lphp4ubsu1f9cb2afkbugj.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[secret — was regenerated after accidental exposure]
SENTRY_DSN=https://abe1c49dc80956b85e063a4595e22806@o4511733984067584.ingest.de.sentry.io/4511734018080848
NEXT_PUBLIC_SENTRY_DSN=[same as above]
SENTRY_ORG=hikeit-kosovo
SENTRY_PROJECT=javascript-nextjs
SENTRY_AUTH_TOKEN=[org token — scopes: project:write + org:read]
NEXT_PUBLIC_THUNDERFOREST_API_KEY=[key — domain-restricted to hikeit.app]
CRON_SECRET=[random secret for cron endpoint auth]
```

### Cron Jobs
Vercel free tier only supports daily crons. Using cron-job.org (free) for:
- Weather check: `https://hikeit.app/api/cron/weather-check` — every 3 hours
- Trip reminders: `https://hikeit.app/api/cron/trip-reminders` — daily 8AM

### Google OAuth
- Google Cloud project: "HikeIt"
- Authorized redirect URIs:
  - http://localhost:3000/api/auth/callback/google
  - https://hikeitapp.vercel.app/api/auth/callback/google
  - https://hikeit.app/api/auth/callback/google

---

## DATABASE SCHEMA (12+ tables, all deployed to production)

All tables use:
- UUID primary keys
- Soft deletes (deletedAt timestamp)
- timestamptz for all dates
- Drizzle ORM for all queries

### Tables
```
users                 — Better Auth managed, extended with role/preferences/avatarUrl
organizations         — Hiking clubs (name, slug, city, logoUrl, coverUrl, memberCount)
organization_members  — Many-to-many users↔orgs with role (admin/organizer/member)
trails                — 15 Kosovo trails seeded (name, slug, region, difficulty, GPX)
trips                 — Organized hiking trips by clubs (status: draft/open/full/completed/cancelled)
trip_registrations    — User registrations for trips (status: confirmed/cancelled/attended)
reviews               — Trail reviews with star ratings
trip_photos           — Photos uploaded to trips (Cloudinary publicId)
trail_photos          — Photos uploaded to trails
weather_alerts        — Generated alerts from Open-Meteo data
notifications         — In-app notifications
audit_logs            — All user actions logged (used for rate limiting too)
waitlist              — Pre-launch email signups
image_hashes          — SHA-256 hashes for Cloudinary deduplication
```

---

## ALL ROUTES (50+ total)

### Public Marketing
```
/                          Landing page (video hero, how it works, features, waitlist)
/trails                    Trail listing (filters: difficulty/region/season/features via nuqs)
/trails/[slug]             Trail detail (map, elevation chart, weather, reviews, nearby)
/clubs                     Club listing (city filter tabs)
/clubs/[slug]              Club profile (cover, stats, gallery, upcoming trips)
/trips                     Trip listing (date/difficulty/region filters)
/trips/[tripId]            Trip detail (map, description, registration card, gallery)
/pricing                   Pricing page (FREE/PRO/TEAM with monthly/yearly toggle)
/about                     About page
/privacy                   Privacy policy
/terms                     Terms of service
/sitemap.xml               Dynamic sitemap (all trails + clubs + open trips)
/robots.txt                Robots (blocks /dashboard, /api, /onboarding)
```

### Auth
```
/login                     Split-screen (dark left panel + light form right)
/register                  Split-screen (with password strength bar, Google OAuth)
/verify-email              Email verification landing
/forgot-password           Password reset
/onboarding                Role selection (Hiker vs Club) — Moss/Orange themed cards + stats bar
```

### Dashboard — Hiker
```
/dashboard                 Panel home (welcome card, 4 stats, upcoming trips, suggested trails/clubs)
/dashboard/my-trips        My trips (tabs: upcoming/past/waitlist)
/dashboard/clubs           My clubs
/dashboard/trails          Saved/browsed trails
/dashboard/profile         Profile + settings (alert sensitivity, language, danger zone)
/dashboard/notifications   All notifications
```

### Dashboard — Club Admin
```
/dashboard/club/[slug]                     Overview (stats: members/active trips/completed/revenue)
/dashboard/club/[slug]/trips               Trips management table (TITULLI/SHTEGU/DATA/STATUS/ÇMIMI)
/dashboard/club/[slug]/trips/create        Trip creation form (4 sections + Cloudinary cover upload)
/dashboard/club/[slug]/trips/[id]          Trip detail with registrations tab
/dashboard/club/[slug]/trips/[id]/edit     Edit trip
/dashboard/club/[slug]/members             Member management table (with min-1-admin safety rule)
/dashboard/club/[slug]/settings            Club settings (logo/cover upload, info)
```

### API
```
/api/auth/[...all]         Better Auth handler (email + Google OAuth)
/api/upload                Cloudinary image upload (security-grade)
/api/cron/weather-check    Weather cron (called by cron-job.org every 3h)
/api/cron/trip-reminders   Trip reminder emails (daily 8AM)
/api/webhooks/paddle       Paddle webhook handler (signature-verified)
```

---

## FEATURES — ALL BUILT

### Authentication
- Email/password with email verification
- Google OAuth (login → /dashboard, register → /onboarding)
- Password reset flow
- Better Auth with trustedOrigins for www/non-www CORS handling
- Role-based: hiker vs club_admin

### Image System (Cloudinary — Security Grade)
12 security rules enforced on every upload:
1. MIME type allowlist only (JPEG, PNG, WebP, HEIC, HEIF — nothing else)
2. Magic bytes validation (can't rename malware.exe to photo.jpg)
3. Dangerous extension blocklist
4. 10MB max file size (server AND client side)
5. Rate limiting: 20 uploads/hour via audit log
6. Server-side uploads only (API secret never touches browser)
7. EXIF stripping (GPS coordinates removed)
8. SHA-256 deduplication (same photo uploaded twice = returns existing URL)
9. Folder isolation by entity: hikeit/trips/{id}/, hikeit/clubs/{id}/, etc.
10. Image-only resource type (no PDFs, no videos)
11. Format allowlist at Cloudinary level
12. isApproved flag for future moderation queue

### Maps
- Leaflet + Thunderforest Outdoors tiles (contour lines, hillshading, hiking paths)
- Trail route display with GPX overlay (Moss colored line)
- Clickable map for trip meeting point selection (red pin marker)
- Dark terrain style
- Meeting point overlay label on trip detail page

### Weather
- Open-Meteo integration (no API key needed)
- Daily weather check cron job
- Weather widget on trail detail (current + 3-day forecast)
- Trip weather widget (hourly forecast for trip date, active hour highlighted)
- Alert sensitivity preferences (E ULËT/MESME/E LARTË)

### GPX
- Upload to trails (admin)
- Download button on trail detail
- Elevation bar chart (recharts BarChart, green bars varying heights)

### Notifications
- Bell component with unread count
- In-app notification page
- Weather alert notifications
- Trip reminder notifications

### Club Management
- Create/edit club with logo + cover photo
- Member management with roles (admin/organizer/member)
- **Safety rule: minimum 1 admin always enforced** (server + UI)
- Join/leave club flow
- Club settings page

### Trips
- Creation form (4 sections: basic info, date/location, participants, price)
- Difficulty selector (L/M/V/E letter buttons with per-difficulty colors)
- Clickable Leaflet map for meeting point
- Registration is free at the platform level; trip price is display-only and collected by the club directly
- Status flow: draft → open → full → completed/cancelled
- Post-trip photo upload by attendees
- Admin trip management table

### SEO (Complete)
- Dynamic metadata on all pages with Albanian keywords
- JSON-LD structured data (Organization, Place, WebSite schemas)
- Dynamic sitemap (all trails + clubs + open trips)
- Robots.txt (blocks dashboard/API from indexing)
- Google Search Console verified (code: PQIIX3BsVYvYS4VfY4ubJaCTmnJ7j_gdqcxnAIajbB8)
- Sitemap submitted to Google
- Key pages indexed
- Image alt text on all images
- AVIF/WebP image format optimization (30-day cache)
- `lang="sq"` on html element

### Sentry (Production Grade)
- Client config: `src/instrumentation-client.ts` (v10 convention)
- Server config: `sentry.server.config.ts`
- Edge config: `sentry.edge.config.ts`
- Instrumentation hook: `src/instrumentation.ts`
- Error boundaries: root, dashboard, marketing, auth, global-error (all 5)
- User context: server-side, no useSession race condition
- Source maps uploaded on build (via SENTRY_AUTH_TOKEN)
- Filters: ignores NEXT_NOT_FOUND, NEXT_REDIRECT, network errors, extensions
- EU data residency (Frankfurt)
- tracesSampleRate: 0.1, replaysSessionSampleRate: 0.05
- Custom utilities: `src/lib/sentry/index.ts` (captureError, captureMessage, trackEvent)

---

## DASHBOARD LAYOUT VARIANTS

The dashboard layout changes completely based on role:

### Hiker Dashboard
- Sidebar: 112px wide, Abyss dark background
- Logo: "HIKEIT" + "Mountaineering Club" subtitle in sidebar
- Nav items (icon above, label below — stacked): PANELI, UDHËTIMET E MIA, KLUBET, SHTIGJET, PROFILI
- Active item: solid Moss fill (#4CAF7D), dark text
- Content area: **Mist (#E8F5ED) light mint background**
- Top bar: Summit background, Forest bottom border

### Club Admin Dashboard
- Sidebar: same 112px, Abyss dark
- Logo: "HIKE ADMIN" + "Vëzhgues i Majave"
- Nav items: PANELI, KLUBI IM, UDHËTIMET, ANËTARËT
- Content area: **Forest (#1A3D2B) dark green background**
- Revenue stat always in Sunset orange (#E87A30)

### Club Management Pages (trips, members, settings)
- Sidebar: "BALKAN CLUBS" + "PEAK CONTROL v1.2" with mountain icon
- Nav items: PËRMBLEDHJE, UDHËTIMET, ANËTARËT, CILËSIMET
- **Active state uses usePathname() — must match current route exactly**
- Content area: **Mist (#E8F5ED) light background**

---

## PAGES REDESIGNED (Stitch → Pixel-perfect implementation)

All these pages were designed in Google Stitch with Alpine Brutalism design system and implemented pixel-perfect:

| Page | Key visual notes |
|------|-----------------|
| Landing | Dark hero + video bg + stats bar, Forest "How it works", Abyss features, Forest waitlist |
| Trails listing | Dark Abyss, 160px sidebar filters, 3-col grid, L/M/V/E difficulty badges |
| Trail detail | Dark hero, 4 adjacent stat boxes (no gap), bar chart elevation, EU weather |
| Clubs listing | **LIGHT Mist background**, dark Forest club cards (contrast!) |
| Club profile | Cover header, stats bar, gallery, upcoming trips |
| Trips listing | Dark, Forest header, filter bar, cards with 3px top accent bar per difficulty |
| Trip detail | Dark, split layout, registration sidebar, gallery lightbox |
| Dashboard hiker | Light Mist, dark sidebar, stat cards, upcoming trips |
| Dashboard club | **Dark Forest content**, dark sidebar, revenue in Sunset |
| Club trips management | **Light Mist**, dark table header, "BALKAN CLUBS" sidebar |
| Trip creation form | Dark Abyss, 4 numbered sections, difficulty letter selector |
| Profile | **Dark Forest content**, breadcrumb, 2-column layout |
| Register | Split screen: dark left (registerGeos.svg + features) + light right form |
| Login | Split screen: dark left (loginGeos.svg + features) + light right form |
| Onboarding | Full dark Abyss, Moss/Orange themed role cards, stats bar |
| Pricing | Light header + toggle, dark cards section (PRO card light on dark) |

---

## THINGS THAT HAVE SPECIFIC IMPLEMENTATIONS

### Password strength bar (register page)
4 segments, 3px height, gap 3px between segments:
- Score 0: all empty (rgba(26,61,43,0.12))
- Score 1-2: red #C0392B (weak)
- Score 3: amber #F5A623 (medium)
- Score 4: moss #4CAF7D (strong)

### Trail card difficulty badges
Single letters only: L (easy/Moss), M (moderate/Alert), V (hard/Sunset), E (expert/Danger)

### Trip card difficulty badges
Full words: MODERAT, VËSHTIRË, LEHTË, EKSTREME

### Trip card spots progress bar
3px height, dynamic color: Moss (<50%), Alert (50-80%), Danger (>80%), full red = PLOTË

### Club admin safety rule
Minimum 1 admin enforced at both server action level AND UI level (disable role selector for last admin)

### Gallery lightbox
`yet-another-react-lightbox` package, dark Abyss overlay (#0D1F14 at 95% opacity), hover scale effect on thumbnails

---

## SOCIAL & SEO

```
Instagram:          https://www.instagram.com/hikeitapp
Facebook:           https://www.facebook.com/hikeitapp
Google Search:      Verified, sitemap submitted, key pages indexed
Google Analytics:   Not yet set up
```

---

## PENDING / TODO

### High priority
- [ ] Wire `captureError`/`trackEvent` Sentry utilities into server actions
- [ ] GPX upload for trails (club admins) + GPX display on map
- [ ] Club-created trails (UGC model with HikeIt admin review/verification)
- [ ] Gallery lightbox on trip detail page (partially done — needs verification)
- [ ] Real Kosovo mountain photos for trail cards (currently using fallback gradients)

### Medium priority
- [ ] **Paddle webhook signature verification fails on sandbox ("Invalid signature").** Route, raw-body handling, header casing, and proxy matcher all checked out clean — the checkout path was descoped to an MVP (see below) before this got resolved. What we established: `@paddle/paddle-node-sdk`'s `webhooks-validator.js` enforces a hard 5-second window between the `ts` in `Paddle-Signature` and verification time, and returns a signature failure indistinguishable from a wrong secret if that window is exceeded — confirmed against the installed SDK with a fixed secret/body, varying only the timestamp. Preview deployments get no warming traffic, so a cold lambda boot (Next init, Drizzle, Sentry, better-auth) routinely blows past 5s on a fresh delivery. Temporary diagnostic logging (`[paddle-webhook-debug]`, logging `hmacMatches` independently of the SDK, plus timestamp skew) was written and deployed to Preview but never actually exercised against a cold lambda before this got reprioritized — pick this up by redeploying that diagnostic (see git history on `feat/paddle-migration` for the exact block) and sending a sandbox event to an idle Preview instance. If `hmacMatches: true` with `exceedsSdkWindow: true`, the fix is verifying before the heavy import chain, not the secret. Not urgent while checkout is disabled — the route needs to work again before any club can subscribe.
- [ ] Set up cron-job.org for weather-check (every 3h) and trip-reminders (daily 8AM)
- [ ] Paddle products + prices created in BOTH sandbox and live accounts (Pro €19/mo · €190/yr, Team €49/mo · €490/yr)
- [ ] Paddle price IDs set in Vercel (see .env.example for all ten PADDLE_* vars)
- [ ] Rewrite /terms §6 and /privacy — both still describe Stripe Connect and a 2.5% commission
- [ ] Late-cancellation notification to club admins — hook point is `cancelMyRegistration` in src/server/actions/trip-registrations.ts, right after the `trip.registration.canceled` audit-log write. Deferred from the Paddle migration to avoid mid-flight scope creep.
- [ ] Blog content: 5 Albanian trail guide posts for SEO
- [ ] Outreach to 5 Kosovo hiking clubs (message template ready in Albanian)
- [ ] Wire Share button = copy URL clipboard on trail/trip detail pages

### Nice to have
- [ ] Legal review of privacy policy and terms
- [ ] Uptime monitoring on Better Stack
- [ ] Google Business Profile for HikeIt in Prishtinë
- [ ] Leaderboards/badges social layer
- [ ] Admin moderation queue for user-uploaded photos

---

## COMMANDS REFERENCE

```bash
# Development
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm typecheck        # TypeScript check (must pass = 0 errors)
pnpm lint             # ESLint (must pass = 0 errors)
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (DB GUI)
pnpm db:seed          # Seed database with initial data

# Always run before committing:
pnpm build && pnpm typecheck && pnpm lint
```

---

## SEEDED DATA

```
Trails:   15 real Kosovo trails (Maja e Gjeravicës, Kanioni i Rugovës, etc.)
Clubs:    6 Kosovo clubs (Sharri, Alpin Kosova, Pashtriku, Gjeravica, Karradaku, Shala e Bajgores)
Trips:    6 example trips (Liqenat e Rugovës, Ngjitja në Majën e Njerit, etc.)
Users:    3 test users with memberships and registrations
```

---

## KNOWN ARCHITECTURE DECISIONS

1. **No Docker** — Supabase cloud + Vercel + Cloudinary = no local servers needed
2. **No React Query** — Next.js Server Components + server actions cover data fetching
3. **No Redux** — nuqs for URL state, useState/Context for local state
4. **Drizzle not Prisma** — faster, edge-compatible, better types
5. **Better Auth not Clerk** — self-hosted, no vendor lock-in, free forever
6. **pnpm not npm** — faster installs, disk efficient
7. **Vercel free crons removed** — Vercel hobby only allows daily; use cron-job.org instead
8. **Unsigned Cloudinary preset** — we upload server-side (browser → our API → Cloudinary), API secret never touches client
9. **No GPS live tracking** — web-first, use GPX download + Komoot/Garmin for navigation
10. **No mobile app** — PWA is sufficient for v1

---

## BUSINESS MODEL

### Pricing (implemented on /pricing page)
- **FREE** — hikers forever: browse trails, join free trips, profile, weather alerts
- **PRO** — €19/month or €190/year: unlimited members, unlimited trips, collect payments, analytics
- **TEAM** — €49/month or €490/year: everything Pro + multiple admins, API access, priority support

### Revenue streams
1. Club subscriptions (Pro/Team)
2. ~~Payment commission~~ — removed. Stripe does not operate in Kosovo, and Paddle is a Merchant of Record with no marketplace/payout model. Clubs collect trip fees from hikers directly; there is no platform commission.

### Target customers
- 25+ hiking clubs in Kosovo using Facebook/WhatsApp
- First 5 targets: Kosovo Hiking Club, HikingNjëri, Alpinistët e Pejës, Sharri Outdoor, Prishtina Alpine Club

---

## HOW TO CONTINUE IN A NEW CHAT

Paste this at the top of any new conversation:

> "I'm continuing work on HikeIt — a fully deployed Kosovo hiking club SaaS at hikeit.app. The project roadmap with full context is in my project files as HikeIt-Roadmap.md. Please read it before anything else and treat this as a continuation of our existing work — you already know the full codebase, design system, and decisions made."

The roadmap file attached to this project contains everything needed to continue seamlessly.

---

Last updated: September 2026
Version: 3.1 (Stripe → Paddle migration)
