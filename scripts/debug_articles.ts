
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const { data, error } = await supabase
    .from('articles')
    .select('title')
    .ilike('title', '%Final Policy Test%')
  
  if (error) {
    console.error(error)
    return
  }
  console.log('Results:', data)
}

test()
