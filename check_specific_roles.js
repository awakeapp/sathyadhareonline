const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Sync read .env.production for keys
const envPath = path.join(process.cwd(), '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    let val = rest.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);
    env[key.trim()] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if(!url || !key) {
  console.log('Keys missing');
  process.exit(1);
}

const supabase = createClient(url, key);

const targetEmails = [
  'shebinaaz1928@gmail.com',
  'shabeeredappalam3@gmail.com',
  'awakeapp.routine@gmail.com',
  'coolcraftadv@gmail.com'
];

async function checkUsers() {
  console.log('--- USER ROLE REPORT ---');
  
  // 1. Check Auth Users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth fetch error:', authError);
    return;
  }

  // 2. Check Profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, role');
  if (profileError) {
    console.error('Profile fetch error:', profileError);
    return;
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  for (const email of targetEmails) {
    const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    const profile = authUser ? profileMap.get(authUser.id) : null;
    
    console.log(`\nEmail: ${email}`);
    console.log(`- Auth Metadata Role: ${authUser?.user_metadata?.role || 'None'}`);
    console.log(`- Profiles Table Role: ${profile?.role || 'No Profile Found'}`);
  }
}

checkUsers();
