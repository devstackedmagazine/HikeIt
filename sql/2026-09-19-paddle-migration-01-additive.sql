-- ============================================================================
-- HikeIt — Paddle migration, PART 1 of 2: ADDITIVE
-- ----------------------------------------------------------------------------
-- Run this FIRST, in the Supabase SQL editor, BEFORE deploying the new code.
--
-- Nothing here removes or rewrites anything the current production code reads.
-- Every statement is idempotent, so re-running it is safe. Running this file
-- against the live database while the OLD code is still deployed is safe: the
-- new columns are simply unused until the deploy lands.
--
-- Part 2 (`...-02-drops.sql`) removes the Stripe Connect and commission
-- columns. Do NOT run it until the new code is deployed and verified.
--
-- Do NOT run `pnpm db:push` for this change — these files are the source of
-- truth and `src/lib/db/schema.ts` is written to match them exactly.
-- ============================================================================

BEGIN;

-- ─── 1. organizations: Paddle subscription columns ──────────────────────────
-- All nullable. A club that has never subscribed has NULL in every one of
-- these, which is the normal resting state, not an incomplete row.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS paddle_customer_id              TEXT,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id          TEXT,
  ADD COLUMN IF NOT EXISTS paddle_subscription_status      TEXT,
  ADD COLUMN IF NOT EXISTS paddle_price_id                 TEXT,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

COMMENT ON COLUMN organizations.paddle_customer_id IS
  'Paddle customer id (ctm_...). NULL until the club first reaches checkout.';
COMMENT ON COLUMN organizations.paddle_subscription_id IS
  'Paddle subscription id (sub_...). NULL when the club has no subscription.';
COMMENT ON COLUMN organizations.paddle_subscription_status IS
  'Paddle status verbatim: active, trialing, past_due, paused, canceled. Stored as free text rather than an enum so a new Paddle status can never fail a write.';
COMMENT ON COLUMN organizations.paddle_price_id IS
  'The Paddle price the club is subscribed on (pri_...) — identifies tier + billing interval.';
COMMENT ON COLUMN organizations.subscription_current_period_end IS
  'End of the current paid period, from Paddle. Drives the renewal date on the billing page.';

-- Deliberately no CHECK constraint on paddle_subscription_status: Paddle owns
-- that vocabulary and can add to it. A constraint here would turn a new,
-- harmless status into a failed webhook write and a silently wrong tier.

-- ─── 2. Lookup indexes for the Paddle webhook ───────────────────────────────
-- Every webhook event resolves an organization by customer or subscription id
-- before it can do anything, so both are hot paths. Partial, because the large
-- majority of rows are NULL (clubs that never subscribed) and indexing those
-- buys nothing.
CREATE INDEX IF NOT EXISTS organizations_paddle_customer_idx
  ON organizations (paddle_customer_id)
  WHERE paddle_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS organizations_paddle_subscription_idx
  ON organizations (paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;

-- ─── 3. invite_codes: trial_months + paddle_discount_id ─────────────────────
-- Added nullable here and only made NOT NULL in step 5, after the backfill.
-- Adding NOT NULL in one step against a table with existing rows would fail.
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS trial_months       INTEGER,
  ADD COLUMN IF NOT EXISTS paddle_discount_id TEXT;

COMMENT ON COLUMN invite_codes.trial_months IS
  'Months of full Pro access the code grants, replacing the standard 3-month trial.';
COMMENT ON COLUMN invite_codes.paddle_discount_id IS
  'Paddle discount (dsc_...) applied at checkout if the club subscribes. NULL = the code grants free runway only. Paddle owns the discount''s own recurrence/usage/expiry rules; max_uses and expires_at here govern redemption of the HikeIt code, not the Paddle discount.';

-- ─── 4. Backfill trial_months ───────────────────────────────────────────────
-- Old codes granted a commission rate for `duration_months`. That meaning is
-- gone; what carries over is the *duration*, reused as trial length.
--
-- `duration_months IS NULL` meant "this rate never expires", which has no
-- equivalent under the new model — an unlimited free trial is not something we
-- want to grant by accident. Those fall back to the standard 3 months.
--
-- Guarded on IS NULL so re-running never overwrites a value you have since
-- corrected by hand.
UPDATE invite_codes
SET trial_months = COALESCE(duration_months, 3)
WHERE trial_months IS NULL;

-- >>> REVIEW BEFORE CONTINUING <<<
-- If you have live partnership codes, check the backfill landed sensibly.
-- Nothing below depends on the *values*, only on there being no NULLs, so you
-- can UPDATE individual rows first and then run step 5.
--
--   SELECT code, duration_months AS old_duration, trial_months AS new_trial,
--          commission_rate AS old_rate, max_uses, used_count, is_active
--     FROM invite_codes
--    ORDER BY created_at DESC;

-- ─── 5. Enforce NOT NULL on trial_months ────────────────────────────────────
-- Safe to re-run: SET NOT NULL on an already-NOT NULL column is a no-op.
-- Fails loudly if step 4 left any NULLs, which is the correct outcome —
-- a code with no trial length grants nothing and should not exist.
ALTER TABLE invite_codes
  ALTER COLUMN trial_months SET NOT NULL;

-- A code granting zero or negative months is always a bug.
ALTER TABLE invite_codes
  DROP CONSTRAINT IF EXISTS invite_codes_trial_months_check;
ALTER TABLE invite_codes
  ADD CONSTRAINT invite_codes_trial_months_check
  CHECK (trial_months > 0 AND trial_months <= 120);

-- ─── 6. Relax the old commission constraints ────────────────────────────────
-- `commission_rate` and `duration_months` still exist at this point (Part 2
-- drops them), but the new code no longer writes them. The old NOT NULL on
-- commission_rate would make every INSERT from the new code fail, so it has to
-- come off now rather than in Part 2.
ALTER TABLE invite_codes
  ALTER COLUMN commission_rate DROP NOT NULL;

-- Same reason: this constraint references duration_months, which the new code
-- leaves NULL on every new row. The NULL branches already permit that, but the
-- constraint is rebuilt here without the duration_months clause so Part 2 can
-- drop the column without tripping over a dependency.
ALTER TABLE invite_codes
  DROP CONSTRAINT IF EXISTS invite_codes_counts_check;
ALTER TABLE invite_codes
  ADD CONSTRAINT invite_codes_counts_check
  CHECK (
    used_count >= 0
    AND (max_uses IS NULL OR max_uses > 0)
  );

COMMIT;

-- ============================================================================
-- Verification — run separately, after COMMIT
-- ============================================================================
--
-- Expect 5 rows, all is_nullable = YES:
--   SELECT column_name, data_type, is_nullable
--     FROM information_schema.columns
--    WHERE table_name = 'organizations'
--      AND (column_name LIKE 'paddle%' OR column_name = 'subscription_current_period_end')
--    ORDER BY column_name;
--
-- Expect 2 rows:
--   SELECT indexname FROM pg_indexes
--    WHERE tablename = 'organizations' AND indexname LIKE '%paddle%';
--
-- Expect trial_months = integer / NO, paddle_discount_id = text / YES:
--   SELECT column_name, data_type, is_nullable
--     FROM information_schema.columns
--    WHERE table_name = 'invite_codes'
--      AND column_name IN ('trial_months', 'paddle_discount_id');
--
-- Expect 0:
--   SELECT count(*) AS codes_without_trial_months
--     FROM invite_codes WHERE trial_months IS NULL;
--
-- ============================================================================
-- After this file: deploy the new code, verify against the route checklist,
-- and only then run 2026-09-19-paddle-migration-02-drops.sql.
-- ============================================================================
