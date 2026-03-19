import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminContainer from '@/components/layout/AdminContainer';
import { 
  FileText, BookOpen, Library, ImageIcon, Mic, Video, 
  MessageCircle, Inbox, ClipboardList, LayoutTemplate, Tag, Users, ChevronRight 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/');
  }

  const role = profile.role;
  const isSuperAdmin = role === 'super_admin';
  const isAdminOrSuper = isSuperAdmin || role === 'admin';
  const isEditor = role === 'editor';

  if (!isAdminOrSuper && !isEditor) {
    redirect('/');
  }

  const fetchCount = async (query: any) => {
    try {
      const { count, error } = await query;
      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  };

  const [
    articlesCount,
    sequelsCount,
    libraryCount,
    booksCountResult,
    fridayCount,
    podcastsCount,
    videosCount,
    commentsCount,
    submissionsCount,
    assignmentsCount,
    bannersCount,
    categoriesCount,
    staffCount
  ] = await Promise.all([
    fetchCount(supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published')),
    fetchCount(supabase.from('sequels').select('*', { count: 'exact', head: true })),
    fetchCount(supabase.from('library').select('*', { count: 'exact', head: true })),
    fetchCount(supabase.from('books').select('*', { count: 'exact', head: true })),
    fetchCount(supabase.from('friday_messages').select('*', { count: 'exact', head: true })),
    fetchCount(supabase.from('podcasts').select('*', { count: 'exact', head: true })),
    fetchCount(supabase.from('videos').select('*', { count: 'exact', head: true })),
    fetchCount(supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_flagged', true)),
    fetchCount(supabase.from('guest_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
    fetchCount(supabase.from('articles').select('*', { count: 'exact', head: true }).not('assigned_to', 'is', null).neq('status', 'published').neq('status', 'deleted')),
    fetchCount(supabase.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true)),
    fetchCount(supabase.from('categories').select('*', { count: 'exact', head: true })),
    fetchCount(supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['admin', 'editor', 'contributor']))
  ]);

  const booksCount = libraryCount || booksCountResult || 0;

  type SectionItem = {
    href: string;
    icon: any;
    iconColor: string;
    label: string;
    description: string;
    show: boolean;
    badge?: {
      count: number;
      type: 'default' | 'alert' | 'assignment';
      text: string;
      zeroText?: string;
    };
  };

  type Section = {
    title: string;
    items: SectionItem[];
  };

  const SECTIONS: Section[] = [
    {
      title: "Content",
      items: [
        { href: "/admin/articles", icon: FileText, iconColor: "#685de6", label: "Articles", description: "All articles and drafts", show: isAdminOrSuper || isEditor, badge: { count: articlesCount, type: 'default', text: 'published' } },
        { href: "/admin/sequels", icon: BookOpen, iconColor: "#0ea5e9", label: "Sequels", description: "Monthly magazine issues", show: isAdminOrSuper, badge: { count: sequelsCount, type: 'default', text: 'total' } },
        { href: "/admin/library", icon: Library, iconColor: "#8b5cf6", label: "Library", description: "Books and chapters", show: isAdminOrSuper, badge: { count: booksCount, type: 'default', text: 'total' } },
        { href: "/admin/friday-messages", icon: ImageIcon, iconColor: "#f59e0b", label: "Friday Messages", description: "Weekly poster publications", show: isAdminOrSuper, badge: { count: fridayCount, type: 'default', text: 'total' } },
        { href: "/admin/podcasts", icon: Mic, iconColor: "#ec4899", label: "Podcasts", description: "Audio episodes", show: isAdminOrSuper, badge: { count: podcastsCount, type: 'default', text: 'total' } },
        { href: "/admin/videos", icon: Video, iconColor: "#ef4444", label: "Videos", description: "Video content", show: isAdminOrSuper, badge: { count: videosCount, type: 'default', text: 'total' } },
      ]
    },
    {
      title: "Community",
      items: [
        { href: "/admin/comments", icon: MessageCircle, iconColor: "#10b981", label: "Comments", description: "Reader comments", show: isAdminOrSuper, badge: { count: commentsCount, type: 'alert', text: 'flagged', zeroText: 'All clear' } },
        { href: "/admin/submissions", icon: Inbox, iconColor: "#f97316", label: "Submissions", description: "Submitted articles", show: isAdminOrSuper || isEditor, badge: { count: submissionsCount, type: 'alert', text: 'pending', zeroText: 'None' } },
      ]
    },
    {
      title: "Assignments",
      items: [
        { href: "/admin/assignments", icon: ClipboardList, iconColor: "#6366f1", label: "Assignments", description: "Content assigned to editors", show: isAdminOrSuper || isEditor, badge: { count: assignmentsCount, type: 'assignment', text: 'active', zeroText: 'None active' } },
      ]
    },
    {
      title: "Site",
      items: [
        { href: "/admin/banners", icon: LayoutTemplate, iconColor: "#6366f1", label: "Banners", description: "Home page banners", show: isAdminOrSuper, badge: { count: bannersCount, type: 'default', text: 'active' } },
        { href: "/admin/categories", icon: Tag, iconColor: "#14b8a6", label: "Categories", description: "Article categories", show: isAdminOrSuper, badge: { count: categoriesCount, type: 'default', text: 'total' } },
      ]
    },
    {
      title: "People",
      items: [
        { href: "/admin/users", icon: Users, iconColor: "#685de6", label: "People", description: "Admins and editors", show: isSuperAdmin, badge: { count: staffCount, type: 'default', text: 'total' } },
      ]
    }
  ];

  const visibleSections = SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => item.show)
  })).filter(section => section.items.length > 0);

  return (
    <AdminContainer className="pt-6 pb-[calc(var(--bottom-nav-height)+1rem)]">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Manage</h1>
      
      <div className="flex flex-col space-y-6">
        {visibleSections.map((section, idx) => (
          <div key={idx}>
            <div className="text-[11px] uppercase font-medium tracking-[0.07em] text-[var(--color-muted)] mb-2 px-1">
              {section.title}
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[14px] overflow-hidden flex flex-col divide-y divide-[var(--color-border)]">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-[12px] p-[13px_16px] hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] active:scale-[0.99] transition-all duration-150"
                  >
                    <div 
                      className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: `color-mix(in srgb, ${item.iconColor} 15%, transparent)`, 
                        color: item.iconColor 
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-[15px] font-medium leading-tight text-[var(--color-text)] truncate">
                        {item.label}
                      </span>
                      <span className="text-[13px] text-[var(--color-muted)] leading-tight mt-1 truncate">
                        {item.description}
                      </span>
                    </div>
                    {item.badge && (
                      item.badge.type === 'default' ? (
                        <div className="text-[11px] font-medium px-[8px] py-[2px] rounded-full mr-[8px] bg-[var(--color-surface-2)] text-[var(--color-muted)] whitespace-nowrap shrink-0">
                          {item.badge.count} {item.badge.text}
                        </div>
                      ) : item.badge.type === 'alert' ? (
                        item.badge.count > 0 ? (
                          <div className="text-[11px] font-medium px-[8px] py-[2px] rounded-full mr-[8px] bg-amber-50 text-amber-600 whitespace-nowrap shrink-0">
                            {item.badge.count} {item.badge.text}
                          </div>
                        ) : (
                          <div className="text-[11px] font-medium px-[8px] py-[2px] rounded-full mr-[8px] bg-[var(--color-surface-2)] text-[var(--color-muted)] whitespace-nowrap shrink-0">
                            {(item.badge as any).zeroText}
                          </div>
                        )
                      ) : item.badge.type === 'assignment' ? (
                        item.badge.count > 0 ? (
                          <div className="text-[11px] font-medium px-[8px] py-[2px] rounded-full mr-[8px] bg-indigo-50 text-indigo-600 whitespace-nowrap shrink-0">
                            {item.badge.count} {item.badge.text}
                          </div>
                        ) : (
                          <div className="text-[11px] font-medium px-[8px] py-[2px] rounded-full mr-[8px] bg-[var(--color-surface-2)] text-[var(--color-muted)] whitespace-nowrap shrink-0">
                            {(item.badge as any).zeroText}
                          </div>
                        )
                      ) : null
                    )}
                    <ChevronRight size={20} className="text-[var(--color-muted)] opacity-50 shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </AdminContainer>
  );
}
