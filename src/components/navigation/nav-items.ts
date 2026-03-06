import { LayoutDashboard, FileText, Library, Users, Menu, SquarePen, Eye, Home, Search, Layers, Mic, ScrollText, Settings, Shield, IndianRupee, LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  exact: boolean;
  icon: LucideIcon;
  highlight?: boolean;
  readerModeToggle?: boolean;
  isMoreToggle?: boolean;
  role?: string;
}

export const ADMIN_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/admin', exact: true, icon: LayoutDashboard },
  { name: 'Articles', href: '/admin/articles', exact: false, icon: FileText },
  { name: 'Categories', href: '/admin/categories', exact: false, icon: Library },
  { name: 'Series', href: '/admin/series', exact: false, icon: Layers },
  { name: 'Users', href: '/admin/users', exact: false, icon: Users },
  { name: 'Financials', href: '/admin/financial', exact: false, icon: IndianRupee, role: 'super_admin' },
  { name: 'Audit Logs', href: '/admin/audit-logs', exact: false, icon: ScrollText, role: 'super_admin' },
  { name: 'Security', href: '/admin/security', exact: false, icon: Shield, role: 'super_admin' },
  { name: 'Settings', href: '/admin/settings', exact: false, icon: Settings, role: 'super_admin' },
];

export const EDITOR_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/editor', exact: true, icon: LayoutDashboard },
  { name: 'My Articles', href: '/editor/articles', exact: false, icon: FileText },
  { name: 'Write', href: '/editor/articles/new', exact: false, icon: SquarePen, highlight: true },
  { name: 'Reader Mode', href: '/', exact: false, icon: Eye, readerModeToggle: true },
];

export const READER_NAV: NavItem[] = [
  { name: 'Home', href: '/', exact: true, icon: Home },
  { name: 'Sequels', href: '/sequels', exact: false, icon: Layers },
  { name: 'Search', href: '/search', exact: false, icon: Search },
  { name: 'Podcast', href: '/podcast', exact: false, icon: Mic },
  { name: 'More', href: '#more', exact: false, icon: Menu, isMoreToggle: true },
];
