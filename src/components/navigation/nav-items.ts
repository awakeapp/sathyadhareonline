import { LayoutDashboard, FileText, Library, Users, Menu, SquarePen, Eye, Home, Search, Layers, Mic } from 'lucide-react';

export const ADMIN_NAV = [
  { name: 'Dashboard', href: '/admin', exact: true, icon: LayoutDashboard },
  { name: 'Articles', href: '/admin/articles', exact: false, icon: FileText },
  { name: 'Categories', href: '/admin/categories', exact: false, icon: Library },
  { name: 'Series', href: '/admin/series', exact: false, icon: Layers },
  { name: 'Users', href: '/admin/users', exact: false, icon: Users },
];

export const EDITOR_NAV = [
  { name: 'Dashboard', href: '/editor', exact: true, icon: LayoutDashboard },
  { name: 'My Articles', href: '/editor/articles', exact: false, icon: FileText },
  { name: 'Write', href: '/editor/articles/new', exact: false, icon: SquarePen, highlight: true },
  { name: 'Reader Mode', href: '/', exact: false, icon: Eye, readerModeToggle: true },
];

export const READER_NAV = [
  { name: 'Home', href: '/', exact: true, icon: Home },
  { name: 'Sequels', href: '/sequels', exact: false, icon: Layers },
  { name: 'Search', href: '/search', exact: false, icon: Search },
  { name: 'Podcast', href: '/podcast', exact: false, icon: Mic },
  { name: 'More', href: '#more', exact: false, icon: Menu, isMoreToggle: true },
];
