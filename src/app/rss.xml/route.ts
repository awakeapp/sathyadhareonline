import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const supabase = await createClient();
  const baseUrl = 'https://sathyadhare.com';

  const { data: articles } = await supabase
    .from('articles')
    .select('title, slug, excerpt, published_at, cover_image, author:profiles(full_name), category:categories(name)')
    .eq('status', 'published')
    .eq('is_deleted', false)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50);

  const items = (articles ?? []).map((a) => {
    const category = Array.isArray(a.category) ? a.category[0] : a.category;
    const author = Array.isArray(a.author) ? a.author[0] : a.author;
    const pubDate = a.published_at ? new Date(a.published_at).toUTCString() : new Date().toUTCString();
    const articleUrl = `${baseUrl}/articles/${encodeURIComponent(a.slug)}`;

    return `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description><![CDATA[${a.excerpt || ''}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${author?.full_name ? `<author>${author.full_name}</author>` : ''}
      ${category?.name ? `<category><![CDATA[${category.name}]]></category>` : ''}
      ${a.cover_image ? `<enclosure url="${a.cover_image}" type="image/jpeg" length="0"/>` : ''}
      <source url="${baseUrl}/rss.xml">Sathyadhare</source>
    </item>`.trim();
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Sathyadhare — ಸತ್ಯಧಾರೆ</title>
    <link>${baseUrl}</link>
    <description>ಕನ್ನಡ ಸಾಹಿತ್ಯ, ಲೇಖನಗಳು ಮತ್ತು ಸ್ವಾರಸ್ಯಕರ ಕಥೆಗಳು — Kannada articles, literature and stories.</description>
    <language>kn</language>
    <copyright>© ${new Date().getFullYear()} Sathyadhare</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/og-cover.png</url>
      <title>Sathyadhare</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
