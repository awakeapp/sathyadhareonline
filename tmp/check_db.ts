
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log('Checking tables...')
  const tables = ['profiles', 'articles', 'categories', 'audit_logs', 'site_settings', 'guest_submissions']
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1)
    if (error) {
      console.log(`❌ ${table}: ${error.message} (${error.code})`)
    } else {
      console.log(`✅ ${table}: Exists`)
    }
  }
}

check()
