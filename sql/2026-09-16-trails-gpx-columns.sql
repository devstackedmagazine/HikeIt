-- ============================================================================
-- HikeIt — GPX columns on `trails`
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (production + any other environment).
-- Every statement is idempotent, so re-running it is safe.
--
-- Do NOT run `pnpm db:push` for this change — this file is the source of truth
-- and `src/lib/db/schema.ts` is written to match it exactly.
--
-- Why this exists: `src/lib/db/schema.ts` declares four GPX columns that were
-- never applied to the database. Every `select` Drizzle builds for `trails`
-- names all of them, so the missing columns don't degrade one feature — they
-- take down every read of the table. /trails, /trails/[slug] and the hiker
-- dashboard's featured-trails block all 500 with:
--     PostgresError: column "gpx_track" does not exist
--
-- Verified against the live database on 2026-09-16: `gpx_url` and
-- `elevation_profile` are already present; these four are not.
-- ============================================================================

BEGIN;

-- ─── Columns ────────────────────────────────────────────────────────────────
-- Downsampled [lng, lat] pairs for the route polyline (see downsampleTrack()
-- in src/server/actions/gpx.ts). All four are nullable: a trail may exist with
-- no GPX file attached, which is the state of every trail seeded so far.
ALTER TABLE trails ADD COLUMN IF NOT EXISTS gpx_track       jsonb;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS gpx_metadata    jsonb;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS gpx_uploaded_at timestamp with time zone;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS gpx_uploaded_by uuid;

-- ─── Foreign key on the uploader ────────────────────────────────────────────
-- ON DELETE SET NULL, matching `trails_submitted_by_users_id_fk`: deleting a
-- user must orphan the upload attribution, never cascade into deleting trails.
-- Constraints have no IF NOT EXISTS, hence the guard.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'trails'::regclass
       AND conname  = 'trails_gpx_uploaded_by_users_id_fk'
  ) THEN
    ALTER TABLE trails
      ADD CONSTRAINT trails_gpx_uploaded_by_users_id_fk
      FOREIGN KEY (gpx_uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── Indexes ────────────────────────────────────────────────────────────────
-- These three are the complete index set `schema.ts` declares for `trails`.
-- All three already exist in the live database — they are included only so
-- this file stands alone on a fresh environment. There is deliberately no
-- index on the GPX columns: nothing filters or orders by them. Every read is
-- by `id` or `slug` and pulls GPX along for the ride, so an index would be
-- write cost for no read benefit.
CREATE INDEX IF NOT EXISTS trails_region_idx       ON trails (region);
CREATE INDEX IF NOT EXISTS trails_difficulty_idx   ON trails (difficulty);
CREATE INDEX IF NOT EXISTS trails_country_code_idx ON trails (country_code);

COMMIT;

-- ─── Verification (run separately after COMMIT) ─────────────────────────────
-- Expect exactly four rows:
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'trails'
--    AND column_name IN ('gpx_track','gpx_metadata','gpx_uploaded_at','gpx_uploaded_by')
--  ORDER BY column_name;
--
-- Expect one row, ON DELETE SET NULL:
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE conrelid = 'trails'::regclass AND contype = 'f';
--
-- Then confirm the app read that was failing now succeeds:
-- SELECT id, slug, gpx_track, gpx_metadata, gpx_uploaded_at, gpx_uploaded_by
--   FROM trails ORDER BY verified DESC, name ASC LIMIT 1;
