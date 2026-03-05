import { LayoutDashboard, FileText, Library, Users, Menu, SquarePen, Eye, Home, Search, User, Layers } from 'lucide-react';

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
  { name: 'Series', href: '/sequels', exact: false, icon: Layers },
  { name: 'Search', href: '/search', exact: false, icon: Search },
  { name: 'Categories', href: '/categories', exact: false, icon: Library },
  { name: 'Profile', href: '/profile', exact: false, icon: User },
];
