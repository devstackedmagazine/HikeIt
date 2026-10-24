-- ============================================================================
-- HikeIt — shift existing trip times to real instants (Kosovo time)
-- ----------------------------------------------------------------------------
-- RUN EXACTLY ONCE. Not idempotent.
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
-- Guards (both in the one UPDATE statement, so it's all-or-nothing):
--   1. Only trips CREATED BEFORE the new code went live. Replace
--      __DEPLOY_TIME__ below with the time the deployment carrying this fix
--      became Ready, in UTC, e.g. '2026-10-26 07:30:00+00'. Until replaced,
--      the statement fails to parse the timestamp and changes nothing.
--      Trips created after that were written correctly and must not move.
--      (A trip edited after deploy without changing its time keeps its old
--      instant — the edit form round-trips it — so it is still correct to
--      shift it.)
--   2. A marker row in audit_logs (action 'migration.trip_times_timezone').
--      If it already exists, the UPDATE matches nothing. This turns a second
--      run into a no-op, but don't rely on it: run once.
--
-- Known caveat: trips inserted by `pnpm db:seed` on a machine set to Kosovo
-- time were already correct and will be shifted too. Check the preview.
-- ============================================================================


-- ─── 1. PREVIEW (read-only) ─────────────────────────────────────────────────
-- Trip id and times only. Run this first and check a few rows: new_start
-- shown in Kosovo time should be what the organiser typed (= old_start shown
-- in UTC).
SELECT id,
       created_at,
       start_datetime                                                   AS old_start,
       (start_datetime AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade' AS new_start,
       ((start_datetime AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade')
         AT TIME ZONE 'Europe/Belgrade'                                 AS new_start_kosovo_wall,
       end_datetime                                                     AS old_end,
       (end_datetime AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade'   AS new_end
  FROM trips
 WHERE created_at < TIMESTAMPTZ '__DEPLOY_TIME__'
 ORDER BY start_datetime DESC
 LIMIT 20;

-- How many rows the UPDATE will touch:
-- SELECT count(*) FROM trips WHERE created_at < TIMESTAMPTZ '__DEPLOY_TIME__';


-- ─── 2. UPDATE (one statement; RUN EXACTLY ONCE) ────────────────────────────
-- Plain UPDATE through a CTE, not via Drizzle, so updated_at is not bumped.
-- end_datetime NULL stays NULL. Returns the number of trips shifted.
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
-- Expect exactly one marker row, with "shifted" equal to the preview count:
-- SELECT created_at, metadata FROM audit_logs
--  WHERE action = 'migration.trip_times_timezone';
--
-- Spot-check: start times shown in Kosovo time should be the times organisers
-- typed (typically round hours like 07:00, 08:00):
-- SELECT id,
--        start_datetime AT TIME ZONE 'Europe/Belgrade' AS start_kosovo,
--        end_datetime   AT TIME ZONE 'Europe/Belgrade' AS end_kosovo
--   FROM trips
--  ORDER BY start_datetime DESC
--  LIMIT 20;
--
-- Sanity: no trip ends before it starts:
-- SELECT count(*) FROM trips WHERE end_datetime IS NOT NULL
--                              AND end_datetime <= start_datetime;  -- expect 0
