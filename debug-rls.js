require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT * FROM pg_policies WHERE tablename = 'comments';"
  });
  
  if (error) {
    console.log('Error calling RPC execute_sql:', error.message);
    // If RPC fails, try another way or just assume we need to add them
    return;
  }
  
  console.log('Policies for comments:');
  console.table(data);
}

checkPolicies();
