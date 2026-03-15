require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await s.from('comments').select('id').limit(1);
  console.log('Admin read:', !!data, error);
  
  // Try inserting a dummy comment to see what happens as a service_role vs anon
  const res = await s.from('comments').insert({
    article_id: '00000000-0000-0000-0000-000000000000',
    user_id: '00000000-0000-0000-0000-000000000000',
    content: 'Test',
    status: 'pending'
  });
  console.log('Admin insert:', res.error ? res.error.message : 'success');
}
main();
