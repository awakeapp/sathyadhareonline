require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

s.from('comments').select('*').limit(1).then(() => {
  s.rpc('execute_sql', { query: "SELECT * FROM pg_policies WHERE tablename = 'comments';" })
   .then(x => console.log(JSON.stringify(x, null, 2)))
   .catch(console.error)
   .finally(() => process.exit(0));
});
