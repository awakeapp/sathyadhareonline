require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies just in case
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can read own submissions" ON guest_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON guest_submissions;

DROP POLICY IF EXISTS "Users can read own permissions" ON user_content_permissions;

-- profiles
CREATE POLICY "Users can read own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- guest_submissions
CREATE POLICY "Users can read own submissions" ON guest_submissions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" ON guest_submissions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_content_permissions
CREATE POLICY "Users can read own permissions" ON user_content_permissions 
FOR SELECT USING (auth.uid() = user_id);

-- audit_logs
-- (No policies created, which means default deny. 
-- Service role bypasses RLS automatically, fulfilling "Only service role can read/insert")
`;

async function applyRLS() {
  const { error } = await supabase.rpc('execute_sql', { query: sql });
  if (error) {
    console.error('Error applying RLS:', error);
  } else {
    console.log('RLS applied successfully.');
  }
}

applyRLS();
