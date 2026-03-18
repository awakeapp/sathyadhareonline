import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ManageContentClient, { BaseContent, ContentType } from './ManageContentClient';

export const dynamic = 'force-dynamic';

export default async function ManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['super_admin', 'admin', 'editor'].includes(profile.role)) {
    redirect('/admin?denied=1');
  }

  // Fetch categorized content in parallel
  // Including Podcasts and Banner Videos now that migration is likely run
  const [articles, sequels, library, friday, banners, categories, podcasts, videos] = await Promise.all([
    supabase.from('articles').select('id, title, status, created_at, author_id, assigned_to, profiles!author_id(full_name), assigned:profiles!assigned_to(full_name)').eq('is_deleted', false).order('created_at', { ascending: false }).limit(40),
    supabase.from('sequels').select('id, title, status, created_at, banner_image, author_id, assigned_to, profiles!author_id(full_name), assigned:profiles!assigned_to(full_name)').eq('is_deleted', false).order('created_at', { ascending: false }),
    supabase.from('books').select('id, title, status, created_at, cover_image, author_id, assigned_to').eq('is_deleted', false).order('created_at', { ascending: false }),
    supabase.from('friday_messages').select('id, title, created_at, is_published, author_id, assigned_to').eq('is_deleted', false).order('created_at', { ascending: false }),
    supabase.from('banners').select('id, image_url, created_at, is_active'),
    supabase.from('categories').select('id, name, created_at, type').eq('is_deleted', false),
    supabase.from('podcasts').select('id, title, status, created_at, cover_image, author_id, assigned_to, profiles!author_id(full_name), assigned:profiles!assigned_to(full_name)').eq('is_deleted', false || true).limit(10), // podcasts might not have is_deleted yet based on migration
    supabase.from('banner_videos').select('id, title, is_active, created_at, thumbnail_url, author_id, assigned_to').eq('is_deleted', false).limit(10),
  ]);

  // Unified mapping
  const content: BaseContent[] = [
    ...(articles.data || []).map(a => ({
      id: a.id,
      title: a.title,
      type: 'article' as ContentType,
      status: (a.status || 'draft') as BaseContent['status'],
      created_at: a.created_at,
      author_id: a.author_id,
      author_name: (a.profiles as any)?.full_name || 'Admin',
      assigned_to: a.assigned_to,
      assigned_name: (a.assigned as any)?.full_name,
    })),
    ...(sequels.data || []).map(s => ({
      id: s.id,
      title: s.title,
      type: 'sequel' as ContentType,
      status: (s.status || 'draft') as BaseContent['status'],
      created_at: s.created_at,
      image: s.banner_image,
      author_id: s.author_id,
      author_name: (s.profiles as any)?.full_name || 'Admin',
      assigned_to: s.assigned_to,
      assigned_name: (s.assigned as any)?.full_name,
    })),
    ...(library.data || []).map(b => ({
      id: b.id,
      title: b.title,
      type: 'book' as ContentType,
      status: (b.status || 'draft') as BaseContent['status'],
      created_at: b.created_at,
      image: b.cover_image,
      author_id: b.author_id,
    })),
    ...(friday.data || []).map(f => ({
      id: f.id,
      title: f.title,
      type: 'friday' as ContentType,
      status: (f.is_published ? 'published' : 'draft') as BaseContent['status'],
      created_at: f.created_at,
      author_id: f.author_id,
    })),
    ...(banners.data || []).map(bn => ({
      id: bn.id,
      title: 'Site Banner',
      type: 'banner' as ContentType,
      status: (bn.is_active ? 'published' : 'draft') as BaseContent['status'],
      created_at: bn.created_at,
      image: bn.image_url,
    })),
    ...(categories.data || []).map(cat => ({
      id: cat.id,
      title: `${cat.name} (${cat.type})`,
      type: 'category' as ContentType,
      status: 'published' as BaseContent['status'],
      created_at: cat.created_at,
    })),
    ...(podcasts.data || []).map(p => ({
      id: p.id,
      title: p.title,
      type: 'podcast' as ContentType,
      status: (p.status || 'draft') as BaseContent['status'],
      created_at: p.created_at,
      image: p.cover_image,
      author_id: p.author_id,
      author_name: (p.profiles as any)?.full_name || 'Admin',
      assigned_to: p.assigned_to,
      assigned_name: (p.assigned as any)?.full_name,
    })),
    ...(videos.data || []).map(v => ({
      id: v.id,
      title: v.title,
      type: 'banner' as ContentType, // Map videos to banners for now or create new type
      status: (v.is_active ? 'published' : 'draft') as BaseContent['status'],
      created_at: v.created_at,
      image: v.thumbnail_url,
      author_id: v.author_id,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Fetch all staff for assignment logic
  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['admin', 'super_admin', 'editor'])
    .order('full_name');

  return (
    <div className="w-full flex flex-col gap-4">
      <ManageContentClient 
        initialContent={content}
        currentUser={{ id: profile.id, role: profile.role }}
        users={(staff || []).map(u => ({ id: u.id, full_name: u.full_name || 'Unknown' }))}
      />
    </div>
  );
}
