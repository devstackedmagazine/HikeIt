-- ============================================================================
-- HikeIt — personal hike logging (`hikes` table)
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (production + any other environment).
-- Every statement is idempotent, so re-running it is safe.
--
-- Do NOT run `pnpm db:push` for this change — this file is the source of truth
-- and `src/lib/db/schema.ts` is written to match it exactly.
--
-- Purely additive: one new enum, one new table. Nothing existing is altered.
-- ============================================================================

BEGIN;

-- ─── Enum ───────────────────────────────────────────────────────────────────
-- Only `private` today. Sharing is not built; add values later with
-- ALTER TYPE hike_visibility ADD VALUE '...'.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hike_visibility') THEN
    CREATE TYPE hike_visibility AS ENUM ('private');
  END IF;
END $$;

-- ─── Table ──────────────────────────────────────────────────────────────────
-- The uploaded GPX file is NOT stored anywhere. It is parsed in memory; only
-- the stats below and gpx_track are kept.
-- gpx_track: downsampled [lat, lng] pairs with ~200m trimmed from each end.
-- Hikes are HARD-deleted (no deleted_at): name, date and stats are
-- location-derived, so nothing is kept once a hike is deleted.
CREATE TABLE IF NOT EXISTS hikes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL,
  name                 text NOT NULL,
  hiked_at             timestamp with time zone NOT NULL,
  distance_km          numeric(7, 2) NOT NULL,
  elevation_gain_m     integer NOT NULL,
  duration_min         integer NOT NULL,
  gpx_track            jsonb NOT NULL,
  trail_id             uuid,
  trip_registration_id uuid,
  visibility           hike_visibility NOT NULL DEFAULT 'private',
  created_at           timestamp with time zone NOT NULL DEFAULT now()
);

-- ─── Constraints ────────────────────────────────────────────────────────────
-- Constraints have no IF NOT EXISTS, hence the guards.
DO $$
BEGIN
  -- Deleting a user deletes their hikes.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'hikes'::regclass
                    AND conname  = 'hikes_user_id_users_id_fk') THEN
    ALTER TABLE hikes
      ADD CONSTRAINT hikes_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Deleting a trail or registration only unlinks the hike; the hike itself
  -- still happened and keeps counting on its own distance.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'hikes'::regclass
                    AND conname  = 'hikes_trail_id_trails_id_fk') THEN
    ALTER TABLE hikes
      ADD CONSTRAINT hikes_trail_id_trails_id_fk
      FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'hikes'::regclass
                    AND conname  = 'hikes_trip_registration_id_trip_registrations_id_fk') THEN
    ALTER TABLE hikes
      ADD CONSTRAINT hikes_trip_registration_id_trip_registrations_id_fk
      FOREIGN KEY (trip_registration_id) REFERENCES trip_registrations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'hikes'::regclass
                    AND conname  = 'hikes_distance_km_positive') THEN
    ALTER TABLE hikes
      ADD CONSTRAINT hikes_distance_km_positive CHECK (distance_km > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'hikes'::regclass
                    AND conname  = 'hikes_duration_min_positive') THEN
    ALTER TABLE hikes
      ADD CONSTRAINT hikes_duration_min_positive CHECK (duration_min > 0);
  END IF;
END $$;

-- ─── Indexes ────────────────────────────────────────────────────────────────
-- The user's hike list and the per-user km sum.
-- Also covers the account-deletion delete by user_id.
CREATE INDEX IF NOT EXISTS hikes_user_hiked_at_idx
  ON hikes (user_id, hiked_at DESC);

-- At most one hike per trip registration. This is what guarantees a trip is
-- never counted twice (once as trail distance, once as a hike, or twice as
-- two hikes) — the app checks too, but this wins any race. NULLs are
-- distinct in a unique index, so unlinked hikes are unaffected. Also serves
-- the NOT EXISTS lookup in the personal-stats query.
CREATE UNIQUE INDEX IF NOT EXISTS hikes_trip_registration_unique
  ON hikes (trip_registration_id);

COMMIT;

-- ─── Verification (run separately after COMMIT) ─────────────────────────────
-- Expect 12 rows:
-- SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--  WHERE table_name = 'hikes'
--  ORDER BY ordinal_position;
--
-- Expect 5 constraints besides the primary key (3 FK, 2 CHECK):
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE conrelid = 'hikes'::regclass
--  ORDER BY conname;
--
-- Expect hikes_pkey plus the two indexes above:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'hikes';
