# Sathyadhare — Auth & Reader Mode Update

## Overview

This update introduces **two major features**:

1. **Unified Authentication with Role-Based Dashboards** — a single `/login` and `/signup` page that automatically redirects users to the correct dashboard based on their role.
2. **Reader Mode Toggle** — privileged users (`super_admin`, `admin`, `editor`) can switch to a "Reader Mode" to browse the site as a regular reader, without losing their session.

---

## 1. Authentication & Role-Based Redirects

### How it works

| Role          | After login →         |
| ------------- | --------------------- |
| `super_admin` | `/admin`              |
| `admin`       | `/admin`              |
| `editor`      | `/editor`             |
| `reader`      | `/` (reader homepage) |

### Key files

- **`src/app/login/page.tsx`** — Single login page used by all roles. Calls `getRedirectPath()` after sign-in.
- **`src/lib/auth/redirectAfterLogin.ts`** — Fetches the user's role from `profiles` table and returns the correct destination.
- **`src/app/auth/callback/route.ts`** — Handles Google OAuth redirect and performs the same role-based redirect.
- **`src/middleware.ts`** — Centrally enforces:
  - Unauthenticated access to `/admin`, `/editor` → redirect to `/login`
  - Already-logged-in users visiting `/login` or `/signup` → redirect to their dashboard

### Testing

```bash
# Test users (create via Supabase Dashboard → Authentication → Users)
super@example.com   | password123  | role: super_admin
admin@example.com   | password123  | role: admin
editor@example.com  | password123  | role: editor
reader@example.com  | password123  | role: reader
```

> [!NOTE]
> After creating a user in Supabase Auth, you must also ensure a row exists in the `profiles` table with the correct `id` and `role` values. This is handled automatically for Email signups (the `signup` page creates the profile) and Google OAuth (the callback creates it). For manually created users, insert manually via Supabase SQL editor:
>
> ```sql
> INSERT INTO profiles (id, full_name, role)
> VALUES ('<user_uuid>', 'Test User', 'super_admin');
> ```

---

## 2. Reader Mode Toggle

### How it works

A privileged user (super_admin / admin / editor) can click **👁️ Switch to Reader Mode** in the top header or the hamburger drawer to visit the reader homepage.

While in reader mode:

- A **purple-to-blue gradient banner** appears at the very top of every page: _"You are in Reader Mode — 🔙 Return to [Dashboard]"_
- The **header also shows a "Back to Dashboard" button** for quick return
- The **bottom navigation bar** switches to the Reader nav items (Home, Series, Search, Saved, More) instead of admin tabs
- The reader sees **exactly the same UI as a regular reader** — no admin buttons, no edit controls

### State management

- **Context**: `src/context/ReaderModeContext.tsx` — a React context with `enableReaderMode`, `disableReaderMode`, and `toggleReaderMode` functions
- **Persistence**: `sessionStorage` key `sathyadhare:readerMode` — resets when the browser tab is closed or the user logs out (auth state change listener in `TopHeader` clears the key on sign-out)
- **No server-side change**: The middleware still enforces role protection. Reader mode is purely a UI toggle.

### Key files changed

| File                                     | Change                                                       |
| ---------------------------------------- | ------------------------------------------------------------ |
| `src/context/ReaderModeContext.tsx`      | **New** — React context for reader mode state                |
| `src/app/layout.tsx`                     | Wraps everything in `<ReaderModeProvider>`                   |
| `src/components/ui/TopHeader.tsx`        | Adds banner, toggle button, and return button                |
| `src/components/ui/BottomNavigation.tsx` | Shows reader nav items when in reader mode                   |
| `src/components/MainWrapper.tsx`         | Adds extra top padding to account for the reader mode banner |

---

## 3. Testing Checklist

- [ ] `reader@example.com` → logs in → lands on `/` (reader homepage)
- [ ] `admin@example.com` → logs in → lands on `/admin`
- [ ] `editor@example.com` → logs in → lands on `/editor`
- [ ] `super@example.com` → logs in → lands on `/admin`
- [ ] On `/admin`, click **👁️ Reader Mode** → navigates to `/`, banner appears
- [ ] In reader mode banner, click **🔙 Return to Admin Dashboard** → goes back to `/admin`, banner gone
- [ ] In reader mode, open hamburger menu → shows **🔙 Back to Admin Dashboard** link
- [ ] Log out while in reader mode → on next login, reader mode is **NOT** active (sessionStorage cleared)
- [ ] In reader mode as admin, directly type `/admin` in URL → middleware **still blocks** if you're an admin but have readerMode active (readerMode is client-side only; middleware enforces on server)
- [ ] In reader mode, bottom navigation shows **Reader** tabs (Home, Series, Search, Saved, More)

---

## 4. Security Note

> [!IMPORTANT]
> Reader mode is **purely a front-end UI convenience**. The `middleware.ts` still enforces role-based access on every request. A user in reader mode cannot bypass server-side protections by typing an admin URL — they will be granted or denied access based on their actual Supabase role, not the reader mode flag.
