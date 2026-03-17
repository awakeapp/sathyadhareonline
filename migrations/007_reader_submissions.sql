-- ═══════════════════════════════════════════════════════════════════════
-- 007_reader_submissions.sql
-- Add reader-account tracking columns to guest_submissions so readers can
-- see their own submission history with status and feedback.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Link submission to a signed-in user account (nullable — old guest subs
--    won't have this, and un-authenticated submissions still allowed)
ALTER TABLE guest_submissions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Rejection reason — admin fills this in when declining a submission
ALTER TABLE guest_submissions
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Published slug — admin fills this in when submission becomes an article
ALTER TABLE guest_submissions
  ADD COLUMN IF NOT EXISTS published_slug TEXT;

-- 4. Index for fast per-reader queries
CREATE INDEX IF NOT EXISTS guest_submissions_user_id_idx
  ON guest_submissions (user_id);

-- 5. RLS: readers can only see their own submissions
--    (assumes RLS is already enabled on guest_submissions)
DO $$
BEGIN
  -- Reader insert policy (already exists as guest insert in most setups,
  -- but we keep it here for clarity)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'guest_submissions'
      AND policyname = 'reader_select_own_submissions'
  ) THEN
    CREATE POLICY reader_select_own_submissions
      ON guest_submissions
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;
