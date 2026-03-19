-- RLS ENHANCEMENT: Secure User Data & System Logs
-- Generated for Sathyadhare Audit

---------------------------------------------------------
-- 1. PROFILES Table
---------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop if exists (defensive migration)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policies
CREATE POLICY "Users can read own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

---------------------------------------------------------
-- 2. GUEST_SUBMISSIONS Table
---------------------------------------------------------
ALTER TABLE public.guest_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own submissions" ON public.guest_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.guest_submissions;

CREATE POLICY "Users can read own submissions" ON public.guest_submissions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" ON public.guest_submissions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

---------------------------------------------------------
-- 3. USER_CONTENT_PERMISSIONS Table
---------------------------------------------------------
ALTER TABLE public.user_content_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own permissions" ON public.user_content_permissions;

CREATE POLICY "Users can read own permissions" ON public.user_content_permissions 
FOR SELECT USING (auth.uid() = user_id);

---------------------------------------------------------
-- 4. AUDIT_LOGS Table
---------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: No explicit policies are created for audit_logs. 
-- By enabling RLS without policies, we achieve a Default Deny for all authenticated/anon clients.
-- The Supabase Service Role (used in `adminClient`) automatically bypasses RLS globally.
-- This satisfies:
--   - No public read access
--   - Only service role can insert
--   - Only service role can read

---------------------------------------------------------
-- 5. COMMENTS Table
---------------------------------------------------------
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
-- No additional requested changes for comments yet, RLS simply enabled to secure it from open public access.
