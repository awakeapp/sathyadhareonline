import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  // ── Defence-in-depth: only editors allowed here ─────────────────
  // Middleware already blocks non-editors, but we add a server-side
  // check in the layout for extra safety.
  if (!profile || profile.role !== 'editor') {
    redirect('/login');
  }

  const name = profile.full_name ?? 'Editor';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/editor',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    },
    {
      name: 'My Articles',
      href: '/editor/articles',
      icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9',
    },
    {
      name: 'Write New Article',
      href: '/editor/articles/new',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      highlight: true,
    },
  ];

  return (
    <div className="flex h-screen bg-[#0f0e15] overflow-hidden text-white font-sans">
      {/* ── Sidebar (desktop) ──────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 hidden md:flex flex-col bg-[#181623] border-r border-white/5">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-white/5 gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-violet-600/30">
            E
          </div>
          <span className="font-bold text-sm tracking-tight text-white">Editor Workspace</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5 scrollbar-none">
          <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold px-3 mb-3">Menu</p>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                item.highlight
                  ? 'text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Footer: reader mode + user + logout */}
        <div className="p-3 border-t border-white/5 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors group"
          >
            <span className="text-base leading-none">👁️</span>
            <span>Reader Mode</span>
            <svg className="w-3.5 h-3.5 ml-auto opacity-40 group-hover:opacity-80 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </Link>

          {/* User chip */}
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 text-[11px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{name}</p>
              <p className="text-[10px] text-white/30 truncate">Editor</p>
            </div>
            <Link href="/logout" title="Sign out" className="text-white/25 hover:text-red-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-white/5 bg-[#181623] flex-shrink-0">
          <span className="font-bold text-sm text-white">Editor Workspace</span>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/50 hover:text-white text-xs font-medium">👁️ Reader</Link>
            <Link href="/logout" className="text-red-400 text-xs font-semibold">Logout</Link>
          </div>
        </div>

        {/* Mobile nav strip */}
        <div className="md:hidden flex gap-1 px-3 py-2 border-b border-white/5 overflow-x-auto scrollbar-none bg-[#181623]/50 flex-shrink-0">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                item.highlight
                  ? 'text-[var(--color-primary)]'
                  : 'text-white/50 hover:text-white'
              }`}>
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
