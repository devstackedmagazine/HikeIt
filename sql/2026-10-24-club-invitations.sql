-- ============================================================================
-- HikeIt — club invitations (`club_invitations` table)
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (production + any other environment).
-- Every statement is idempotent and stands on its own: no transaction, no DO
-- blocks, so each one can be run (or re-run) by itself in the SQL editor.
-- Run them top to bottom: the indexes and RLS need the table to exist.
--
-- Do NOT run `pnpm db:push` for this change — this file is the source of truth
-- and `src/lib/db/schema.ts` is written to match it exactly.
--
-- Purely additive: one new table. Nothing existing is altered. Reuses the
-- existing `org_member_role` enum.
--
-- Until this has run, the code on `feat/club-invitations` must not ship:
-- `inviteMember` writes to this table.
-- ============================================================================


-- ─── 1. Table ───────────────────────────────────────────────────────────────
-- An admin invites an email address; the invitee opens /invite/<token>, logs in
-- with that same email and accepts. Membership is only created on accept.
--
-- token_hash: SHA-256 (hex) of the token in the emailed link. The raw token is
--   never stored — a leaked row can't be turned back into a working link. The
--   format check below rejects anything that isn't 64 lowercase hex characters,
--   so a raw token can't be written here by mistake.
-- email: stored lowercase (checked), compared against the logged-in user's
--   lowercased email on accept.
-- role: never 'admin' — admins are promoted from the members list instead.
-- expires_at: set by the app (7 days after the invite is sent / re-sent).
-- accepted_at / declined_at: at most one is set. Both NULL = pending (expiry
--   is checked by the app, so an expired-but-unanswered row is still the
--   "pending" row that a re-invite refreshes).
--
-- Constraints are declared inline: CREATE TABLE IF NOT EXISTS skips them
-- together with the table, which is what makes them safe to re-run without
-- DO-block guards.
CREATE TABLE IF NOT EXISTS club_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL
    CONSTRAINT club_invitations_organization_id_organizations_id_fk
    REFERENCES organizations(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            org_member_role NOT NULL DEFAULT 'member',
  token_hash      text NOT NULL,
  invited_by      uuid
    CONSTRAINT club_invitations_invited_by_users_id_fk
    REFERENCES users(id) ON DELETE SET NULL,
  expires_at      timestamp with time zone NOT NULL,
  accepted_at     timestamp with time zone,
  accepted_by     uuid
    CONSTRAINT club_invitations_accepted_by_users_id_fk
    REFERENCES users(id) ON DELETE SET NULL,
  declined_at     timestamp with time zone,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT club_invitations_token_hash_unique UNIQUE (token_hash),
  CONSTRAINT club_invitations_token_hash_sha256
    CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT club_invitations_email_lowercase
    CHECK (email = lower(email)),
  CONSTRAINT club_invitations_role_not_admin
    CHECK (role IN ('member', 'organizer')),
  CONSTRAINT club_invitations_single_outcome
    CHECK (accepted_at IS NULL OR declined_at IS NULL)
);


-- ─── 2. Indexes ─────────────────────────────────────────────────────────────
-- At most one pending invite per club and email. A re-invite updates that row
-- (new token, new expiry) instead of inserting a second one.
CREATE UNIQUE INDEX IF NOT EXISTS club_invitations_pending_unique
  ON club_invitations (organization_id, email)
  WHERE accepted_at IS NULL AND declined_at IS NULL;

-- Covers the ON DELETE CASCADE from organizations and per-club listings.
CREATE INDEX IF NOT EXISTS club_invitations_organization_id_idx
  ON club_invitations (organization_id);


-- ─── 3. Row Level Security ──────────────────────────────────────────────────
-- Same reasoning as invite_codes: the table is only touched by server actions
-- running as the database owner (which bypasses RLS). RLS with no policies
-- gives the Supabase anon/authenticated roles zero rows. Deliberately no FORCE
-- ROW LEVEL SECURITY — that would lock the app itself out.
ALTER TABLE club_invitations ENABLE ROW LEVEL SECURITY;


-- ─── Verification (run separately, after the statements above) ─────────────
-- Expect 'club_invitations' (NULL means the table doesn't exist):
-- SELECT to_regclass('public.club_invitations');
--
-- Expect 12 rows:
-- SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND table_name = 'club_invitations'
--  ORDER BY ordinal_position;
--
-- Expect relrowsecurity = true:
-- SELECT relname, relrowsecurity
--   FROM pg_class
--  WHERE oid = 'public.club_invitations'::regclass;
--
-- Optional — expect the 2 indexes plus the pkey and token_hash unique:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'club_invitations';
