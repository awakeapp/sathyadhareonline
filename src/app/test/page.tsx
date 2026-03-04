import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.from('profiles').select('*')
  const { data: { session } } = await supabase.auth.getSession()
  
  // Test our RPC function logic directly
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin')

  return (
    <main style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Supabase Connection Test</h1>

      {error ? (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          <strong>Error:</strong>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <strong style={{ color: 'green' }}>
            ✅ Connected — {data?.length ?? 0} row(s) in profiles
          </strong>
          <pre style={{ marginTop: '1rem', background: '#f4f4f4', padding: '1rem', borderRadius: '8px' }}>
            Session Auth UID: {session?.user?.id || 'No session'}{'\n'}
            isAdmin(): {String(isAdmin)}{'\n'}
            rpcError: {JSON.stringify(rpcError, null, 2)}
          </pre>
          <pre style={{ marginTop: '1rem', background: '#f4f4f4', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxHeight: '500px' }}>
            Profiles Data: {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </main>
  )
}
