import { LayoutDashboard, FileText, Library, Users, Menu, SquarePen, Eye, Home, Search, Layers, Mic, ScrollText, Settings, Shield, IndianRupee, BarChart2, MessageSquare, Image as ImageIcon, Mail, LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  exact: boolean;
  icon: LucideIcon;
  highlight?: boolean;
  readerModeToggle?: boolean;
  isMoreToggle?: boolean;
  isDashboardReturn?: boolean;
  role?: string;
}

export const SUPER_ADMIN_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/admin', exact: true, icon: LayoutDashboard },
  { name: 'Articles', href: '/admin/articles', exact: false, icon: FileText },
  { name: 'Categories', href: '/admin/categories', exact: false, icon: Library },
  { name: 'Sequel', href: '/admin/sequels', exact: false, icon: Layers },
  { name: 'Users', href: '/admin/users', exact: false, icon: Users },
  { name: 'Financials', href: '/admin/financial', exact: false, icon: IndianRupee },
  { name: 'Audit Logs', href: '/admin/audit-logs', exact: false, icon: ScrollText },
  { name: 'Security', href: '/admin/security', exact: false, icon: Shield },
  { name: 'Settings', href: '/admin/settings', exact: false, icon: Settings },
  { name: 'Reader Mode', href: '/', exact: false, icon: Eye, readerModeToggle: true },
];

export interface NavSectionItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  sub?: string;
  highlight?: boolean;
  readerToggle?: boolean;
  color?: string;
  bg?: string;
}

export interface NavSection {
  title?: string;
  items: NavSectionItem[];
}

export const SA_MANAGE_ITEMS: NavSectionItem[] = [
  { label: 'Users', sub: 'Accounts & roles', href: '/admin/users', icon: Users, color: '#a78bfa', bg: 'rgba(124,58,237,0.15)' },
  { label: 'Analytics', sub: 'Traffic & growth', href: '/admin/analytics', icon: BarChart2, color: '#60a5fa', bg: 'rgba(37,99,235,0.15)' },
  { label: 'Comments', sub: 'Moderation queue', href: '/admin/comments', icon: MessageSquare, color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
  { label: 'Media', sub: 'File library', href: '/admin/media', icon: ImageIcon, color: '#f472b6', bg: 'rgba(236,72,153,0.15)' },
  { label: 'Sequels', sub: 'Collections', href: '/admin/sequels', icon: Layers, color: '#fb923c', bg: 'rgba(234,88,12,0.15)' },
  { label: 'Audit Logs', sub: 'Activity history', href: '/admin/audit-logs', icon: ScrollText, color: '#c084fc', bg: 'rgba(168,85,247,0.15)' },
];

export const SA_MORE_ITEMS: NavSectionItem[] = [
  { label: 'Settings', sub: 'Site config & branding', href: '/admin/settings', icon: Settings, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { label: 'Email Templates', sub: 'Welcome & System', href: '/admin/email-templates', icon: Mail, color: '#60a5fa', bg: 'rgba(37,99,235,0.15)' },
  { label: 'Security', sub: 'API keys, logins', href: '/admin/security', icon: Shield, color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
  { label: 'Financial', sub: 'Revenue & plans', href: '/admin/financial', icon: IndianRupee, color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
];

export const SA_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Articles', href: '/admin/articles', icon: FileText },
    ],
  },
  {
    title: 'Content & Users',
    items: SA_MANAGE_ITEMS,
  },
  {
    title: 'System',
    items: SA_MORE_ITEMS,
  },
  {
    items: [
      { label: 'Reader Mode', href: '/', icon: Eye, readerToggle: true },
    ],
  },
];

export const ADMIN_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/admin', exact: true, icon: LayoutDashboard },
  { name: 'Articles', href: '/admin/articles', exact: false, icon: FileText },
  { name: 'Categories', href: '/admin/categories', exact: false, icon: Library },
  { name: 'Sequels', href: '/admin/sequels', exact: false, icon: Layers },
  { name: 'Users', href: '/admin/users', exact: false, icon: Users },
  { name: 'Reader Mode', href: '/', exact: false, icon: Eye, readerModeToggle: true },
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
