
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Look for .env.local in the current working directory (root)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. URL:', !!supabaseUrl, 'Key:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatusColumn() {
  console.log('Checking profiles table...');
  const { data, error } = await supabase
    .from('profiles')
    .select('role, status')
    .limit(1);

  if (error) {
    console.log('Error selecting role, status:', error.message);
    if (error.message.includes('column "status" does not exist')) {
       console.log('RESULT: The "status" column IS MISSING.');
    } else {
       console.log('RESULT: Some other error occurred.');
    }
  } else {
    console.log('RESULT: The "status" column EXISTS.');
  }
}

checkStatusColumn();
