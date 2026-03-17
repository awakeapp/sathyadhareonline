const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load from .env.local
const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if(!url || !key) {
  console.log('No keys found in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, role');
  if(error) {
    console.error(error);
    return;
  }
  console.log('Profiles in DB:', JSON.stringify(profiles, null, 2));
}

check();
