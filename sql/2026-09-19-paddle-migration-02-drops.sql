-- ============================================================================
-- HikeIt — Paddle migration, PART 2 of 2: DROPS
-- ----------------------------------------------------------------------------
-- Run this SECOND, in the Supabase SQL editor, ONLY AFTER:
--   1. Part 1 (`...-01-additive.sql`) has been run, and
--   2. the new code is DEPLOYED and verified against the route checklist.
--
-- Everything here is irreversible. A dropped column takes its data with it.
-- The columns below only ever held Stripe Connect sandbox data and commission
-- state that no longer has any meaning, but read the pre-flight queries in
-- section 0 before running anything — they are the last chance to look.
--
-- Every statement is idempotent, so re-running it is safe.
--
-- Do NOT run `pnpm db:push` for this change — these files are the source of
-- truth and `src/lib/db/schema.ts` is written to match them exactly.
-- ============================================================================

-- ─── 0. PRE-FLIGHT — run these SELECTs on their own, first ──────────────────
-- Nothing below is destructive; these exist so you can see what you are about
-- to discard. If any number surprises you, stop.
--
-- Registrations that ever carried real money. Expect 0 rows — Connect never
-- went live. If this returns anything, DO NOT PROCEED: export it first.
--   SELECT id, trip_id, user_id, payment_status, amount_paid_eur,
--          platform_fee_eur, stripe_payment_intent_id, registered_at
--     FROM trip_registrations
--    WHERE payment_status IN ('paid', 'refunded')
--       OR amount_paid_eur IS NOT NULL
--       OR stripe_payment_intent_id IS NOT NULL;
--
-- Clubs that started Connect onboarding. Expect 0 rows.
--   SELECT slug, name, stripe_connect_account_id, stripe_account_status
--     FROM organizations
--    WHERE stripe_connect_account_id IS NOT NULL
--       OR stripe_account_status <> 'not_connected';
--
-- Clubs on a commission grant. These lose their grant; under the new model
-- the equivalent is a longer trial, which you can set per club afterwards via
-- the admin panel's ZGJAT PROVËN action. Note the slugs before proceeding.
--   SELECT slug, name, commission_rate, commission_override_until,
--          commission_override_reason, commission_override_note, trial_ends_at
--     FROM organizations
--    WHERE commission_rate IS NOT NULL;
--
-- Registrations stranded mid-checkout — see section 1.
--   SELECT count(*) AS stranded_pending
--     FROM trip_registrations WHERE status = 'pending';

BEGIN;

-- ─── 1. Release registrations stranded mid-checkout ─────────────────────────
-- `status = 'pending'` only ever meant "Stripe Checkout was opened and hasn't
-- come back yet". No new code path can produce it, so any such row is an
-- abandoned checkout that will stay pending forever.
--
-- This is not cosmetic. The unique index
-- `trip_registrations_trip_user_active_unique` covers every row WHERE
-- status <> 'canceled', so a stranded pending row permanently blocks that
-- hiker from registering for that trip again. Canceling them frees the slot.
--
-- Deliberately canceled rather than confirmed: nobody paid, and quietly
-- confirming a paid trip for free would hand a club a participant it never
-- agreed to take.
UPDATE trip_registrations
SET status      = 'canceled',
    canceled_at = COALESCE(canceled_at, now())
WHERE status = 'pending';

-- ─── 2. trip_registrations: drop the payment columns ────────────────────────
-- The index goes first. DROP COLUMN would take it anyway, but naming it makes
-- the intent explicit and keeps this file readable as a record of what was
-- removed.
DROP INDEX IF EXISTS trip_registrations_payment_intent_idx;

ALTER TABLE trip_registrations
  DROP COLUMN IF EXISTS stripe_payment_intent_id,
  DROP COLUMN IF EXISTS stripe_charge_id,
  DROP COLUMN IF EXISTS amount_paid_eur,
  DROP COLUMN IF EXISTS platform_fee_eur,
  DROP COLUMN IF EXISTS payment_status;

COMMENT ON COLUMN trip_registrations.is_reregistration IS
  'True when the hiker had already canceled this trip once. Recorded so a club can see churn on its roster; it no longer restricts the hiker.';

-- ─── 3. organizations: drop Stripe Connect + commission columns ─────────────
-- CHECK constraints that reference only a dropped column are removed with it,
-- but dropping them by name first keeps this idempotent and self-documenting.
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_commission_override_reason_check,
  DROP CONSTRAINT IF EXISTS organizations_commission_rate_range_check;

ALTER TABLE organizations
  DROP COLUMN IF EXISTS stripe_connect_account_id,
  DROP COLUMN IF EXISTS stripe_account_status,
  DROP COLUMN IF EXISTS stripe_onboarding_completed_at,
  DROP COLUMN IF EXISTS commission_rate,
  DROP COLUMN IF EXISTS commission_override_until,
  DROP COLUMN IF EXISTS commission_override_reason,
  DROP COLUMN IF EXISTS commission_override_note;

-- Kept, with their meaning changed. Re-commented so the database explains
-- itself to whoever reads it next.
COMMENT ON COLUMN organizations.trial_ends_at IS
  'Free trial end. While this is in the future the club has full Pro access regardless of subscription_tier. Set to now() + 3 months at creation, or longer if an invite code granted more. Resolved through resolveEntitlement() — never read directly to decide what a club may do.';
COMMENT ON COLUMN organizations.invite_code_used IS
  'The invite code redeemed at club creation. Historical record of how the club signed up; not part of any active grant.';
COMMENT ON COLUMN organizations.trial_ending_notified_at IS
  'Set once the "trial ends in 7 days" email has been sent, so the daily cron cannot re-send it. Reset to NULL when a super admin extends the trial, so the club is warned about the new end date.';

-- NOT dropped, on purpose: stripe_customer_id, stripe_subscription_id and
-- subscription_status still back the Stripe subscription path, which stays
-- live until the Paddle cutover. They become dead at that point and should be
-- dropped in a follow-up file then — not here.

-- ─── 4. invite_codes: drop the commission columns ───────────────────────────
-- The constraint referencing duration_months was already rebuilt without it in
-- Part 1 step 6, so there is nothing left depending on these.
ALTER TABLE invite_codes
  DROP CONSTRAINT IF EXISTS invite_codes_commission_rate_range_check;

ALTER TABLE invite_codes
  DROP COLUMN IF EXISTS commission_rate,
  DROP COLUMN IF EXISTS duration_months;

-- ─── 5. Drop the now-unreferenced enum types ────────────────────────────────
-- Only reachable once every column using them is gone, which sections 2 and 3
-- have just done. DROP TYPE (no CASCADE) is the safe form: if anything still
-- references either type, this errors and rolls the transaction back rather
-- than silently destroying a column somewhere else.
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS stripe_account_status;

-- `registration_status` is deliberately left alone. Its 'pending' value is now
-- unreachable (section 1 drained the last rows), but Postgres cannot remove a
-- value from an enum — it would mean recreating the type and rewriting the
-- column. It stays in the type and is never written.

COMMIT;

-- ============================================================================
-- Verification — run separately, after COMMIT
-- ============================================================================
--
-- Expect 0 rows:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'organizations'
--      AND (column_name LIKE 'commission%' OR column_name LIKE 'stripe_connect%'
--           OR column_name IN ('stripe_account_status', 'stripe_onboarding_completed_at'));
--
-- Expect exactly these 3 (the subscription path, kept until the cutover):
--   stripe_customer_id, stripe_subscription_id, subscription_status
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'organizations' AND column_name LIKE '%stripe%'
--    ORDER BY column_name;
--
-- Expect 0 rows:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'trip_registrations'
--      AND column_name IN ('payment_status', 'stripe_payment_intent_id',
--                          'stripe_charge_id', 'amount_paid_eur', 'platform_fee_eur');
--
-- Expect 0 rows:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'invite_codes'
--      AND column_name IN ('commission_rate', 'duration_months');
--
-- Expect 0 rows:
--   SELECT typname FROM pg_type
--    WHERE typname IN ('payment_status', 'stripe_account_status');
--
-- Expect 0:
--   SELECT count(*) AS stranded_pending
--     FROM trip_registrations WHERE status = 'pending';
-- ============================================================================
