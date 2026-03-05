# SATHYADHARE Project Analysis

## 1. Architecture & Stack

The project is built on a modern, high-performance web stack tailored for a content-driven application.

- **Framework**: [Next.js](https://nextjs.org/) (Version 16.1.6) using the **App Router** for optimized routing and Server Components.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety and maintainability.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Version 4.0+) utilizing a design-token-based approach for high-end aesthetics.
- **Backend & DB**: [Supabase](https://supabase.com/) (PostgreSQL) for data storage, real-time features, and managed backend services.
- **Authentication**: [Supabase Auth](https://supabase.com/auth) via `@supabase/ssr`, supporting Email/Password and **Google OAuth**.
- **Editor**: [Tiptap](https://tiptap.dev/) for a robust, customizable rich-text editing experience in the admin panel.
- **Typography**: Google Fonts integration (`DM Sans` and `Baloo Tamma 2`).

## 2. Pages & Components

The application is bifurcated into a **Reader Interface** and an **Admin/Editor Suite**.

### Main Pages

- `/`: The Reader Homepage featuring featured banners, trending articles, and latest sequels.
- `/login` & `/signup`: Unified, responsive authentication pages with role-aware redirection.
- `/admin`: The primary Command Center for `super_admin` and `admin` roles, displaying metrics and quick actions.
- `/editor`: A specialized dashboard for editors to manage content.
- `/articles/[slug]`: Dynamic article view for reading stories.
- `/categories/[slug]`: Filtered listing of articles by category.
- `/search`: Global search functionality.

### Key Components

- `TopHeader`: A smart, theme-aware global header. It dynamically displays a "Back to Admin Dashboard" link for privileged users on the reader side.
- `BottomNavigation`: A mobile-first, native-feeling navigation bar.
- `HeroBanner` & `ArticleCard`: Visual-centric components for content discovery.
- `RichTextEditor`: The administrative tool for creating and updating articles with Markdown and image support.

## 3. Data Flow & Storage

Data is handled with a focus on persistence and real-time state consistency.

- **Database**: Supabase PostgreSQL hosts tables for `articles`, `categories`, `profiles`, `sequels`, and `article_views`.
- **State Management**:
  - **Server State**: Shared via Next.js Server Components and layout-level data fetching.
  - **Client State**: Managed via React `useState` and `useEffect`.
  - **Persistence**: `localStorage` is used for UI preferences like the theme (`light`/`dark`).
- **Authentication Tokens**: Managed by Supabase as secure cookies, validated server-side by `src/middleware.ts` to prevent unauthorized access.

## 4. Authentication & Users

The project implements a robust Role-Based Access Control (RBAC) system.

- **Roles**:
  - `super_admin`: Unrestricted access, including User & Role management.
  - `admin`: Full access to content management and media.
  - `editor`: Access to content editing tools.
  - `reader`: Standard consumer access.
- **Security**: The `middleware.ts` acts as a central guard, preventing unauthorized role access to `/admin` or `/editor` routes.
- **Session Management**: A unified session is shared between all interfaces. If an admin logs in, they remain authenticated when switching to the Reader view.

## 5. UI/UX Patterns

The app prioritizes a "Premium Native App" feel.

- **Design Aesthetic**: High-contrast dark mode with vibrant accents (`#ffe500` and `#0047ff`). Uses "Glassmorphism" and card-based layouts.
- **Responsiveness**: Fully responsive across mobile (centered cards), tablet, and desktop (split layouts for auth).
- **Navigation**: "Back to Admin Dashboard" shortcuts for admins on the reader site ensure seamless transitions without re-authentication.
- **Feedback**: Real-time password strength indicators and real-time auth status updates in the header.

## 6. Potential Integration Points

- **New Dashboards**: To add a new role-based dashboard (e.g., `author`), create a folder in `src/app/author/` and update `ROUTE_ROLES` in `src/middleware.ts`.
- **Core Logic**: Global logic enhancements fit into `src/app/layout.tsx` (server-side) or `src/components/ui/TopHeader.tsx` (client-side).
- **Database Extensions**: New tables should be added to the Supabase schema and integrated via `src/lib/supabase`.
