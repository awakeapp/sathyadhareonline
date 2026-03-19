-- ============================================================
-- ADVANCED PERMISSIONS & SECURITY LOGGING
-- Date: 2026-03-18
-- ============================================================

-- 1. Support for Granular Publishing Control
-- Add publish-specific toggles for admins and editors
ALTER TABLE user_content_permissions 
  ADD COLUMN IF NOT EXISTS can_publish_articles boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_publish_sequels  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_publish_library  boolean NOT NULL DEFAULT true;

-- 2. Enhanced Security Log Columns in Profiles
-- Capture device and location data for audits
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_sign_in_ip     text,
  ADD COLUMN IF NOT EXISTS last_sign_in_agent  text,
  ADD COLUMN IF NOT EXISTS account_notes        text;

-- 3. Update Profile Roles Constraint
-- Explicitly allow 'contributor' role
-- Note: Checking if your Supabase schema uses a CHECK constraint on role
-- If not, this is informative. If yes, we need to update it.
DO $$ 
BEGIN 
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'admin', 'editor', 'contributor', 'reader'));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================================
-- DONE
-- ============================================================
