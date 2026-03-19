-- ============================================================
-- Migration: Security Audit Fields
-- Date: 2026-03-18
-- ============================================================

-- 1. Profiles: Tracking last login metrics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_sign_in_ip text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_sign_in_agent text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_notes text;

-- 2. Audit Logs: Dedicated columns for better indexing/visibility
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent text;

-- 3. Comments: Ensure soft delete is present (redundant but safe)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 4. RLS Policy Cleanup/Refinement for Comments
DO $$ BEGIN
  -- Drop old broadly permissive policy if it exists and replace with one that checks user_id
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'comments: public insert') THEN
    DROP POLICY "comments: public insert" ON comments;
  END IF;
  
  -- New Insert Policy: Guests can insert (user_id is null) or Auth users match their ID
  CREATE POLICY "comments: public insert" ON comments 
    FOR INSERT WITH CHECK (
      (auth.uid() IS NULL AND user_id IS NULL) OR 
      (auth.uid() = user_id)
    );
END $$;
