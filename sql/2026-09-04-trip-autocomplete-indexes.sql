-- ============================================================================
-- HikeIt — indexes for the hourly trip auto-completion cron
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (production + any other environment).
-- Every statement is idempotent, so re-running it is safe.
--
-- Do NOT run `pnpm db:push` for this change — this file is the source of truth
-- and `src/lib/db/schema.ts` is written to match it exactly.
--
-- Why these are needed at all:
--   `trips` already has `trips_status_idx` (status) and
--   `trips_start_datetime_idx` (start_datetime), but neither serves
--   /api/cron/complete-trips. `trips_status_idx` can't narrow by time.
--   `trips_start_datetime_idx` covers trips in *every* status, so it keeps
--   growing with the completed/canceled archive the cron never needs to read,
--   and it has nothing at all to say about `end_datetime` — which is the
--   column the majority branch of the query filters on.
--
--   The cron's WHERE is two OR'd branches, one per cutover rule, so it takes
--   two indexes. Both are partial on the live open/full set, which is a tiny
--   fraction of the table and stays small as history accumulates — Postgres
--   can BitmapOr the two scans together.
-- ============================================================================

BEGIN;

-- ─── Branch 1: trips that declared an end time ──────────────────────────────
-- Serves: end_datetime IS NOT NULL AND end_datetime <= $now - interval '90 minutes'
CREATE INDEX IF NOT EXISTS trips_autocomplete_end_idx
  ON trips (end_datetime)
  WHERE status IN ('open', 'full')
    AND deleted_at IS NULL
    AND end_datetime IS NOT NULL;

-- ─── Branch 2: trips with no end time (12h fallback) ────────────────────────
-- Serves: end_datetime IS NULL AND start_datetime <= $now - interval '12 hours'
CREATE INDEX IF NOT EXISTS trips_autocomplete_start_idx
  ON trips (start_datetime)
  WHERE status IN ('open', 'full')
    AND deleted_at IS NULL
    AND end_datetime IS NULL;

COMMIT;

-- Plain CREATE INDEX rather than CONCURRENTLY: `trips` is small today, so the
-- ACCESS EXCLUSIVE lock is milliseconds, and CONCURRENTLY cannot run inside the
-- transaction block the Supabase SQL editor wraps around this. If `trips` ever
-- reaches a size where that lock matters, drop the BEGIN/COMMIT and run each
-- CREATE INDEX CONCURRENTLY on its own instead.

-- ─── Verification (run separately after COMMIT) ─────────────────────────────
-- Expect both indexes listed:
-- SELECT indexname, indexdef
--   FROM pg_indexes
--  WHERE tablename = 'trips' AND indexname LIKE 'trips_autocomplete%';
--
-- Confirm the planner actually picks them up (should show a BitmapOr over the
-- two trips_autocomplete_* indexes, not a Seq Scan on trips):
-- EXPLAIN
-- SELECT id FROM trips
--  WHERE status IN ('open', 'full')
--    AND deleted_at IS NULL
--    AND (
--          (end_datetime IS NOT NULL AND end_datetime <= now() - interval '90 minutes')
--       OR (end_datetime IS NULL AND start_datetime <= now() - interval '12 hours')
--    );
--
-- NOTE: on a near-empty `trips` table the planner will pick a Seq Scan anyway
-- because it's genuinely cheaper — that's correct behaviour, not a broken
-- index. What matters is that the plan flips to the indexes as the table grows.
