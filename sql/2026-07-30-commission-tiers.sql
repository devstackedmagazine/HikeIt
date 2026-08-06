-- ============================================================================
-- HikeIt — commission tiers: free trial, invite codes, super-admin overrides
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (production + any other environment).
-- Every statement is idempotent, so re-running it is safe.
--
-- Do NOT run `pnpm db:push` for this change — this file is the source of truth
-- and `src/lib/db/schema.ts` is written to match it exactly.
-- ============================================================================

BEGIN;

-- ─── 1. organizations: trial + commission override columns ──────────────────
-- `trial_ends_at` already exists in production; IF NOT EXISTS makes that a
-- no-op rather than an error.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commission_rate            NUMERIC(5, 4),
  ADD COLUMN IF NOT EXISTS commission_override_until  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commission_override_reason TEXT,
  ADD COLUMN IF NOT EXISTS commission_override_note   TEXT,
  ADD COLUMN IF NOT EXISTS invite_code_used           TEXT,
  ADD COLUMN IF NOT EXISTS trial_ending_notified_at   TIMESTAMPTZ;

COMMENT ON COLUMN organizations.commission_rate IS
  'Explicit commission override as a decimal (0.0000–1.0000). NULL = not overridden; resolution falls through to the trial, then the platform default.';
COMMENT ON COLUMN organizations.commission_override_until IS
  'When the override stops applying. NULL together with a non-null commission_rate = a permanent grant.';
COMMENT ON COLUMN organizations.trial_ending_notified_at IS
  'Set once the "trial ends in 7 days" email has been sent, so the daily cron cannot re-send it.';

-- Only the two reasons the application knows how to resolve.
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_commission_override_reason_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_commission_override_reason_check
  CHECK (
    commission_override_reason IS NULL
    OR commission_override_reason IN ('invite_code', 'super_admin')
  );

-- A rate outside [0, 1] is always a bug (the app additionally clamps to the
-- 2.5% platform default before charging anything).
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_commission_rate_range_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_commission_rate_range_check
  CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 1));

-- ─── 2. Backfill: existing clubs get the 3-month trial too ──────────────────
-- Guarded on IS NULL, so re-running never extends a trial that already exists.
UPDATE organizations
SET trial_ends_at = now() + INTERVAL '3 months'
WHERE trial_ends_at IS NULL;

-- ─── 3. invite_codes ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invite_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stored uppercase; redemption uppercases the input before looking it up.
  code            TEXT        NOT NULL,
  commission_rate NUMERIC(5, 4) NOT NULL,
  duration_months INTEGER,               -- NULL = permanent
  max_uses        INTEGER,               -- NULL = unlimited
  used_count      INTEGER     NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,           -- NULL = the code never expires
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Named to match what drizzle-kit generates for `.unique()`, so a future
-- `db:push` sees the schema as already in sync. This UNIQUE constraint is also
-- the btree index that redemption's `code` lookup uses — no separate index
-- needed.
DO $$
BEGIN
  ALTER TABLE invite_codes ADD CONSTRAINT invite_codes_code_unique UNIQUE (code);
EXCEPTION
  WHEN duplicate_table OR duplicate_object THEN NULL;
END
$$;

ALTER TABLE invite_codes
  DROP CONSTRAINT IF EXISTS invite_codes_commission_rate_range_check;
ALTER TABLE invite_codes
  ADD CONSTRAINT invite_codes_commission_rate_range_check
  CHECK (commission_rate >= 0 AND commission_rate <= 1);

ALTER TABLE invite_codes
  DROP CONSTRAINT IF EXISTS invite_codes_counts_check;
ALTER TABLE invite_codes
  ADD CONSTRAINT invite_codes_counts_check
  CHECK (
    used_count >= 0
    AND (max_uses IS NULL OR max_uses > 0)
    AND (duration_months IS NULL OR duration_months > 0)
  );

-- ─── 4. Row Level Security on invite_codes ──────────────────────────────────
-- Yes, RLS belongs here. invite_codes is read and written exclusively by
-- server actions running as the database owner (which bypasses RLS). Enabling
-- RLS with *no policies* means the Supabase `anon` and `authenticated` roles —
-- i.e. anything reachable from a browser through PostgREST — get zero rows and
-- cannot insert. Without it, a partnership code granting 0% commission would be
-- enumerable by any logged-in user.
--
-- Deliberately no FORCE ROW LEVEL SECURITY: that would apply RLS to the owner
-- role as well and lock the application itself out.
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ─── Verification (run separately after COMMIT) ─────────────────────────────
-- Expect 7 rows. The OR group must stay parenthesised — AND binds tighter, so
-- without the parens this also returns trial_* columns from every other table.
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'organizations'
--    AND (column_name LIKE 'commission%' OR column_name LIKE 'trial%');
--
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'invite_codes';
--
-- SELECT count(*) AS clubs_without_trial FROM organizations WHERE trial_ends_at IS NULL;
