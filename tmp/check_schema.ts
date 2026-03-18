import { createClient } from './src/lib/supabase/server';

async function check() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('articles').select('assigned_to').limit(1);
  if (error) {
    console.log('Error or missing assigned_to:', error.message);
  } else {
    console.log('assigned_to exists!');
  }
}
check();
