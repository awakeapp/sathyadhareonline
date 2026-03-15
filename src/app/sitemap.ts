import { createClient } from '@/lib/supabase/server';
import type { MetadataRoute } from 'next';

export const revalidate = 3600; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = 'https://sathyadhare.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/library`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/sequels`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/videos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/podcast`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/editorial`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/friday`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];

  // Articles
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .eq('is_deleted', false)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(500);

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map(a => ({
    url: `${baseUrl}/articles/${encodeURIComponent(a.slug)}`,
    lastModified: new Date(a.updated_at || a.published_at || new Date()),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Sequels
  const { data: sequels } = await supabase
    .from('sequels')
    .select('slug, updated_at')
    .eq('status', 'published')
    .eq('is_deleted', false);

  const sequelPages: MetadataRoute.Sitemap = (sequels ?? []).map(s => ({
    url: `${baseUrl}/sequels/${s.slug}`,
    lastModified: new Date(s.updated_at || new Date()),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  // Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at');

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map(c => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: new Date(c.updated_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...articlePages, ...sequelPages, ...categoryPages];
}
