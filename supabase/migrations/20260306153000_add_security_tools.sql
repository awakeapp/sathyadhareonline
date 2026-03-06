-- 1. Create API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    key_hash text NOT NULL,
    created_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now(),
    last_used_at timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admins can manage API keys" ON api_keys FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
);

-- 2. Spam column for comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_comments_is_spam ON comments(is_spam);

-- 3. Login History Access
-- By default, public schema cannot query auth.audit_log_entries easily.
-- This function runs with elevated privileges (security definer) to fetch login audting.
CREATE OR REPLACE FUNCTION get_login_history()
RETURNS TABLE (
  log_id uuid,
  user_id uuid,
  email text,
  role text,
  ip_address text,
  user_agent text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id AS log_id,
    l.actor_id AS user_id,
    p.email,
    p.role,
    l.ip_address::text,
    (l.payload->>'user_agent')::text AS user_agent,
    l.created_at
  FROM auth.audit_log_entries l
  LEFT JOIN public.profiles p ON l.actor_id = p.id
  WHERE l.payload->>'action' = 'login' OR l.action = 'login'
  ORDER BY l.created_at DESC;
END;
$$;

-- Revoke public access to the function just in case
REVOKE EXECUTE ON FUNCTION get_login_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_login_history() TO authenticated;
