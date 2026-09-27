-- ============================================================================
-- HikeIt — scope image dedupe per user
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (production + any other environment).
-- Every statement is idempotent, so re-running it is safe.
--
-- Do NOT run `pnpm db:push` for this change — this file is the source of truth
-- and `src/lib/db/schema.ts` is written to match it exactly.
--
-- Why: `image_hashes.hash` is unique table-wide, so when user B uploads the
-- same bytes as user A, B is handed A's Cloudinary asset and no hash row is
-- recorded for B. Two consequences:
--   1. Records owned by different users share one asset, so deleting one
--      user's photo destroyed the other user's image.
--   2. B has no ownership record for the image, so the new "you may only
--      attach images you uploaded" rule would reject B's own photo.
-- Scoping uniqueness to (uploaded_by, hash) gives every user their own asset.
--
-- Constraint name verified against the live database on 2026-09-27:
--   image_hashes_hash_unique  UNIQUE (hash)
--
-- No data migration: the current table-wide constraint guarantees no two rows
-- share a hash, so the new (uploaded_by, hash) index cannot conflict. Assets
-- already shared across users stay safe because deletes now check every
-- referencing column before destroying anything.
-- ============================================================================

BEGIN;

-- Drops the constraint and its backing index together.
ALTER TABLE image_hashes DROP CONSTRAINT IF EXISTS image_hashes_hash_unique;

-- NULL uploaded_by (the uploader's account was deleted) is distinct in a
-- unique index, so orphaned rows never block anyone's upload.
CREATE UNIQUE INDEX IF NOT EXISTS image_hashes_user_hash_unique
  ON image_hashes (uploaded_by, hash);

-- Ownership checks on attach, and hash-row cleanup on delete, both look rows
-- up by public id.
CREATE INDEX IF NOT EXISTS image_hashes_public_id_idx
  ON image_hashes (cloudinary_public_id);

COMMIT;

-- ─── Verification (run separately after COMMIT) ─────────────────────────────
-- Expect: image_hashes_pkey, image_hashes_uploaded_by_users_id_fk (constraints)
-- and NO image_hashes_hash_unique:
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint WHERE conrelid = 'image_hashes'::regclass;
--
-- Expect image_hashes_pkey, image_hashes_user_hash_unique,
-- image_hashes_public_id_idx:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'image_hashes';
