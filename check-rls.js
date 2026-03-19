require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAll() {
  const tables = ['profiles', 'articles', 'guest_submissions', 'user_content_permissions', 'audit_logs', 'comments'];
  for (const table of tables) {
    const { data: rlsData } = await supabase.rpc('execute_sql', {
      query: `SELECT relrowsecurity FROM pg_class WHERE relname = '${table}';`
    });
    const { data: policiesData } = await supabase.rpc('execute_sql', {
      query: `SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = '${table}';`
    });
    
    console.log(`\n--- Table: ${table} ---`);
    console.log('RLS Enabled:', rlsData?.[0]?.relrowsecurity ?? 'Unknown/Missing');
    console.log('Policies:');
    console.table(policiesData || []);
  }
}

checkAll();
