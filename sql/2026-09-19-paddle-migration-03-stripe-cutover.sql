-- ============================================================================
-- HikeIt — Paddle migration, PART 3 of 3: STRIPE CUTOVER
-- ----------------------------------------------------------------------------
-- Run this LAST, after Parts 1 and 2, and only once Paddle billing is live and
-- verified.
--
-- Part 2 deliberately kept three columns because the Stripe *subscription*
-- path was still running at that point. It no longer is: the Stripe SDK, the
-- webhook route and the billing actions have all been replaced by Paddle
-- equivalents, and nothing in the codebase reads these columns any more.
--
-- Irreversible. Every statement is idempotent, so re-running it is safe.
--
-- Do NOT run `pnpm db:push` for this change — these files are the source of
-- truth and `src/lib/db/schema.ts` is written to match them exactly.
-- ============================================================================

-- ─── 0. PRE-FLIGHT — run this SELECT on its own, first ──────────────────────
-- Clubs carrying any Stripe subscription state. Expect 0 rows: Stripe products
-- were never created, so no club ever subscribed. If this returns anything,
-- STOP and export it — it is the only record that the subscription existed.
--
--   SELECT slug, name, stripe_customer_id, stripe_subscription_id,
--          subscription_status, subscription_tier
--     FROM organizations
--    WHERE stripe_customer_id IS NOT NULL
--       OR stripe_subscription_id IS NOT NULL
--       OR subscription_status IS NOT NULL;

BEGIN;

-- ─── 1. organizations: drop the Stripe subscription columns ─────────────────
-- `subscription_status` goes too: it held Stripe's status vocabulary, and
-- Paddle's equivalent lives in `paddle_subscription_status`. Keeping both
-- would leave two columns answering the same question with one always stale.
ALTER TABLE organizations
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS subscription_status;

COMMIT;

-- ============================================================================
-- Verification — run separately, after COMMIT
-- ============================================================================
--
-- Expect 0 rows:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'organizations' AND column_name LIKE '%stripe%';
--
-- Expect exactly 5: paddle_customer_id, paddle_price_id,
-- paddle_subscription_id, paddle_subscription_status,
-- subscription_current_period_end
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'organizations'
--      AND (column_name LIKE 'paddle%' OR column_name = 'subscription_current_period_end')
--    ORDER BY column_name;
--
-- Expect subscription_tier to still be there — it is the source of truth for
-- paid access and is NOT part of this migration:
--   SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'organizations' AND column_name = 'subscription_tier';
-- ============================================================================
