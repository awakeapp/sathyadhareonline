const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    let val = rest.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    env[key.trim()] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function debugMerge() {
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from('profiles').select('id, email, role');
  
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  
  const targetEmails = [
    'coolcraftadv@gmail.com',
    'awakeapp.routine@gmail.com',
    'shabeeredappalam3@gmail.com'
  ];

  console.log('--- MERGE DEBUG ---');
  for (const email of targetEmails) {
    const au = authUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!au) {
      console.log(`${email}: NOT FOUND IN AUTH`);
      continue;
    }
    const up = profileMap.get(au.id);
    
    console.log(`\nEmail: ${email}`);
    console.log(`- Auth ID: ${au.id}`);
    console.log(`- Profile Found: ${up ? 'YES' : 'NO'}`);
    if (up) {
      console.log(`- Profile ID: ${up.id}`);
      console.log(`- Profile Role: "${up.role}"`);
    } else {
      // Check if profile exists by email instead
      const upByEmail = profiles.find(p => p.email?.toLowerCase() === email.toLowerCase());
      if (upByEmail) {
        console.log(`- !! Profile exists but with DIFFERENT ID: ${upByEmail.id}`);
      }
    }
    
    // Test the logic in page.tsx
    const metaRole = (au.user_metadata?.role || '').toLowerCase().trim().replace(/\s+/g, '_');
    const tableRole = (up?.role || '').toLowerCase().trim().replace(/\s+/g, '_');
    const isValidStaff = (r) => ['admin', 'super_admin', 'editor'].includes(r);
    const finalRole = isValidStaff(tableRole) ? tableRole : (isValidStaff(metaRole) ? metaRole : 'reader');
    console.log(`- FINAL DETECTED ROLE: ${finalRole}`);
  }
}

debugMerge();
