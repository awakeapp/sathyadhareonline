import { LayoutDashboard, FileText, Library, Users, Menu, SquarePen, Eye, Home, Search, Layers, Mic, ScrollText, Settings, Shield, IndianRupee, BarChart2, MessageSquare, Image as ImageIcon, Mail, LucideIcon, Send, Trash2, Calendar, BookOpen, Tags } from 'lucide-react';

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
  { name: 'Library', href: '/admin/library', exact: false, icon: Library },
  { name: 'Categories', href: '/admin/categories', exact: false, icon: Tags },
  { name: 'Sequels', href: '/admin/sequels', exact: false, icon: Layers },
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

export const SA_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Articles', href: '/admin/articles', icon: FileText },
      { label: 'Authors', href: '/admin/users?role=author', icon: Users },
      { label: 'Library', href: '/admin/library', icon: BookOpen },
      { label: 'Categories', href: '/admin/categories', icon: Tags },
      { label: 'Media Library', href: '/admin/media', icon: ImageIcon },
      { label: 'Submissions', href: '/admin/submissions', icon: Send },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Comments', href: '/admin/comments', icon: MessageSquare },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'User Management', href: '/admin/users', icon: Users },
      { label: 'Roles & Permissions', href: '/admin/security', icon: Shield },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    items: [
      { label: 'Reader Mode', href: '/', icon: Eye, readerToggle: true },
    ],
  },
];

export const ADMIN_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard',  href: '/admin',           icon: LayoutDashboard, exact: true },
      { label: 'Articles',   href: '/admin/articles',  icon: FileText },
    ],
  },
  {
    title: 'Content & Users',
    items: [
      { label: 'Library',    href: '/admin/library',     icon: BookOpen    },
      { label: 'Categories', href: '/admin/categories', icon: Tags       },
      { label: 'Users',     href: '/admin/users',      icon: Users        },
      { label: 'Submissions', href: '/admin/submissions', icon: Send },
      { label: 'Comments',  href: '/admin/comments',   icon: MessageSquare },
      { label: 'Media',     href: '/admin/media',       icon: ImageIcon    },
      { label: 'Sequels',   href: '/admin/sequels',     icon: Layers       },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Newsletter', href: '/admin/newsletter', icon: Mail },
      { label: 'Friday Message', href: '/admin/friday',     icon: Calendar },
      { label: 'Trash',      href: '/admin/trash',      icon: Trash2 },
    ],
  },
  {
    items: [
      { label: 'Reader Mode', href: '/', icon: Eye, readerToggle: true },
    ],
  },
];

export const EDITOR_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard',   href: '/editor',               icon: LayoutDashboard, exact: true },
      { label: 'My Articles', href: '/editor/articles',      icon: FileText },
      { label: 'Write',       href: '/editor/articles/new',  icon: SquarePen, highlight: true },
    ],
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
  { name: 'Library', href: '/admin/library', exact: false, icon: Library },
  { name: 'Categories', href: '/admin/categories', exact: false, icon: Tags },
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
  { name: 'Articles', href: '/articles', exact: false, icon: FileText },
  { name: 'Library', href: '/library', exact: false, icon: Library },
  { name: 'Sequels', href: '/sequels', exact: false, icon: Layers },
  { name: 'Search', href: '/search', exact: false, icon: Search },
  { name: 'Podcast', href: '/podcast', exact: false, icon: Mic },
  { name: 'More', href: '#more', exact: false, icon: Menu, isMoreToggle: true },
];
