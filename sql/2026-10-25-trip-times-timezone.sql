-- ============================================================================
-- HikeIt — shift existing trip times to real instants (Kosovo time)
-- ----------------------------------------------------------------------------
-- RUN EXACTLY ONCE. Not idempotent.
--
-- STEP 0 FIRST: run the CHECK query in section 0. It must return exactly two
-- rows, start_datetime and end_datetime, BOTH with data_type
-- 'timestamp with time zone'. If either is anything else (e.g. 'timestamp
-- without time zone'), STOP: the conversion below is wrong for that type.
--
-- Why: until this fix, the server (UTC on Vercel) read the form's
-- "2026-11-01T08:00" as 08:00 UTC, so every trip was stored 1 h (winter) or
-- 2 h (summer) late. The new code reads it as Kosovo time (Europe/Belgrade).
-- This shifts the rows written by the old code so they mean what the
-- organiser typed:
--
--   new = (old AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade'
--
-- `old AT TIME ZONE 'UTC'` gives back the wall-clock time the organiser typed
-- (08:00); `… AT TIME ZONE 'Europe/Belgrade'` reads that wall time as Kosovo
-- time, with the DST offset in force *on that date* (07:00Z in winter, 06:00Z
-- in summer). No fixed +1/+2.
--
-- Columns: trips.start_datetime, trips.end_datetime. There are no other trip
-- date/time columns (no registration deadline). created_at / updated_at /
-- deleted_at are real instants written by now() and are NOT touched.
--
-- __DEPLOY_TIME__: replace EVERY occurrence (find-and-replace all) with the time
-- the production deployment carrying this fix became Ready, in UTC with an
-- explicit offset, exactly in this format:
--
--   2026-10-25 14:05:00+00
--
-- Until replaced, the statements fail to parse the timestamp and change
-- nothing.
--
-- Guards (all in the one UPDATE statement, so it's all-or-nothing):
--   1. created_at < deploy time: trips created after the deploy were written
--      correctly by the new code and must not move.
--   2. updated_at < deploy time: a trip edited by the new code after the
--      deploy is never shifted twice. CAVEAT: the app bumps updated_at on
--      EVERY write to trips (status open/full on registrations, the hourly
--      complete-trips job, cover photo, weather), not only on edits. An old
--      trip touched that way after the deploy is skipped and stays 1–2 h
--      late. Run this within minutes of the deploy, and check section 1b:
--      it lists every skipped trip so it can be fixed by hand.
--   3. A marker row in audit_logs (action 'migration.trip_times_timezone').
--      If it already exists, the UPDATE matches nothing. This turns a second
--      run into a no-op, but don't rely on it: run once.
--      audit_logs: only `action` is NOT NULL without a default (id and
--      created_at have defaults; user_id, entity_*, metadata, ip, user agent
--      are nullable), so action + metadata is a valid insert. No personal
--      data is written.
--
-- Known caveat: trips inserted by `pnpm db:seed` on a machine set to Kosovo
-- time were already correct and will be shifted too. Check the preview.
-- ============================================================================

-- ─── 0. CHECK (read-only) — must return timestamp with time zone ×2 ────────
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='trips' AND column_name IN ('start_datetime','end_datetime');

-- ─── 1. PREVIEW (read-only) ─────────────────────────────────────────────────
SELECT id,
       created_at,
       updated_at,
       start_datetime                                                   AS old_start,
       (start_datetime AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade' AS new_start,
       ((start_datetime AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade')
         AT TIME ZONE 'Europe/Belgrade'                                 AS new_start_kosovo_wall,
       end_datetime                                                     AS old_end,
       (end_datetime AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade'   AS new_end
  FROM trips
 WHERE created_at < TIMESTAMPTZ '__DEPLOY_TIME__'
   AND updated_at < TIMESTAMPTZ '__DEPLOY_TIME__'
 ORDER BY start_datetime DESC
 LIMIT 20;
-- SELECT count(*) FROM trips
--  WHERE created_at < TIMESTAMPTZ '__DEPLOY_TIME__'
--    AND updated_at < TIMESTAMPTZ '__DEPLOY_TIME__';

-- ─── 1b. SKIPPED (read-only): old trips written to after the deploy ────────
-- These were created by the old code but touched after the deploy, so the
-- UPDATE leaves them alone. Check each by hand: if its time shows 1–2 h late
-- in the app, the organiser re-enters it in the edit form.
SELECT id, created_at, updated_at, status,
       start_datetime AT TIME ZONE 'Europe/Belgrade' AS start_kosovo_now
  FROM trips
 WHERE created_at < TIMESTAMPTZ '__DEPLOY_TIME__'
   AND updated_at >= TIMESTAMPTZ '__DEPLOY_TIME__'
 ORDER BY updated_at;

-- ─── 2. UPDATE (one statement; RUN EXACTLY ONCE) ────────────────────────────
WITH guard AS (
  SELECT NOT EXISTS (
    SELECT 1 FROM audit_logs WHERE action = 'migration.trip_times_timezone'
  ) AS ok
),
shifted AS (
  UPDATE trips
     SET start_datetime =
           (start_datetime AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade',
         end_datetime =
           (end_datetime AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade'
   WHERE created_at < TIMESTAMPTZ '__DEPLOY_TIME__'
     AND updated_at < TIMESTAMPTZ '__DEPLOY_TIME__'
     AND (SELECT ok FROM guard)
  RETURNING id
),
marker AS (
  INSERT INTO audit_logs (action, metadata)
  SELECT 'migration.trip_times_timezone',
         jsonb_build_object(
           'shifted', (SELECT count(*) FROM shifted),
           'cutoff',  '__DEPLOY_TIME__'
         )
   WHERE (SELECT ok FROM guard)
  RETURNING id
)
SELECT (SELECT count(*) FROM shifted) AS trips_shifted,
       (SELECT count(*) FROM marker)  AS marker_written;

-- ─── 3. VERIFICATION (read-only, run after) ─────────────────────────────────
-- SELECT created_at, metadata FROM audit_logs WHERE action = 'migration.trip_times_timezone';
-- SELECT id, start_datetime AT TIME ZONE 'Europe/Belgrade' AS start_kosovo,
--        end_datetime AT TIME ZONE 'Europe/Belgrade' AS end_kosovo
--   FROM trips ORDER BY start_datetime DESC LIMIT 20;
-- SELECT count(*) FROM trips WHERE end_datetime IS NOT NULL AND end_datetime <= start_datetime; -- expect 0
