import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function FixSlugsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return <div>Please login first.</div>

  const adminSb = createAdminClient()
  if (!adminSb) return <div>Admin client not available (check environment variables).</div>

  // Find articles with empty slugs
  const { data: emptyArticles } = await adminSb
    .from('articles')
    .select('id, title, slug')
    .or('slug.eq.,slug.is.null')

  async function fixSlugsAction() {
    'use server'
    const sb = createAdminClient()
    if (!sb) return

    const { data: empty } = await sb
      .from('articles')
      .select('id, title')
      .or('slug.eq.,slug.is.null')

    if (!empty) return

    for (const art of empty) {
      const newSlug = art.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0080-\uFFFF]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || `article-${art.id.slice(0,8)}`;
      
      await sb.from('articles').update({ slug: newSlug }).eq('id', art.id)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Slug Recovery Tool</h1>
      <p>Found {emptyArticles?.length || 0} articles with missing or empty slugs.</p>
      
      {emptyArticles && emptyArticles.length > 0 && (
        <ul>
          {emptyArticles.map(a => (
            <li key={a.id}>{a.title} (ID: {a.id})</li>
          ))}
        </ul>
      )}

      <form action={fixSlugsAction}>
        <button type="submit" style={{ padding: '10px 20px', background: '#5c4ae4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Fix All Empty Slugs
        </button>
      </form>
    </div>
  )
}
