# Implementation: Admin Portal — Route Architecture, Access Control & Dashboard Shell

This document outlines the architecture and implementation of the `/admin` route for the STRIDE Physiotherapy clinic portal. It covers access control via Supabase Auth, a 403 denial screen for unauthorized visitors, an inline admin login form, and the persistent sidebar-based dashboard shell.

---

## 1. Access Control Architecture

### Authentication Flow

```
Anyone → /admin → beforeLoad checks Supabase session
                     ├── NOT authenticated → "Access Denied" screen
                     │                         └── (no login form, no hints)
                     └── Authenticated → AdminShell + Dashboard

Admin (direct access) → /admin → sees "Access Denied" screen
                                    └── enters a secret key combination / hidden trigger
                                         └── Login form appears (inline, same route)
                                              ├── Invalid creds → Error message
                                              └── Valid creds → Supabase session → Dashboard
```

> **Note:** There is only one slug: `/admin`. The login form is never publicly exposed. A non-admin user navigating to `/admin` will always see the "Access Denied" screen. The admin must use a secret interaction (e.g., a key sequence or hidden trigger — TBD, see §2a) to reveal the login form within the same page, without a separate `/admin/login` route ever existing.

### Key Principles
- **There is only one slug: `/admin`.** No `/admin/login`, no sub-routes — only `/admin`.
- **Unauthorized visitors** navigating to `/admin` see a clean **"Access Denied"** screen — no login form, no admin layout, no system information exposed.
- **The login form is hidden by default** and revealed only by a secret interaction known to the admin (e.g., pressing a specific key sequence). It appears inline on the same `/admin` page — no navigation, no URL change.
- **Supabase Auth** handles credential storage, session tokens, and session persistence. Admin users are managed directly in the Supabase dashboard — no self-registration is exposed.
- Admin routes are excluded from search engine indexing via `noindex, nofollow` meta tags.
- The public site layout (SiteNav, Footer, BookingModal) is completely hidden on `/admin`.

---

## 2a. Open Question: How Does the Admin Reveal the Login Form?

Create a protected admin area using Supabase Auth.

- Route: /admin
- When an unauthenticated visitor accesses /admin, show a login form with email and password fields.
- After successful login, redirect to /admin/dashboard.
- If the user is already authenticated and is the admin account, automatically redirect them from /admin to /admin/dashboard.
- If authentication fails, display an error message.
- Do not expose an Admin link in the public website navigation.
- Only the single admin Supabase account should be allowed to access the dashboard and booking-management features.
- Use Supabase session persistence so the admin remains logged in across page refreshes until they sign out.

---

## 2b. Technology Stack

| Concern | Solution |
|---------|----------|
| Auth provider | Supabase Auth (email + password) |
| Session management | Supabase client-side session (persisted in localStorage) |
| Route guarding | TanStack Router `beforeLoad` + route context |
| Server functions | TanStack Start `createServerFn` |
| Admin UI shell | shadcn/ui `Sidebar` component (already in project) |
| Icons | Lucide React (already in project) |
| State management | Route context (auth state), React state (UI — login form visibility) |

---

## 3. File Structure

```
src/
├── lib/
│   ├── supabase.ts              # Supabase client singleton
│   └── admin.server.ts          # Server functions for auth
├── routes/
│   └── admin.tsx                # Single /admin route (no sub-routes)
├── components/
│   └── admin/
│       ├── AdminForbidden.tsx    # 403 Access Denied screen (with hidden login trigger)
│       ├── AdminLogin.tsx        # Login form component (rendered inline on /admin)
│       ├── AdminShell.tsx        # Sidebar + content shell
│       └── AdminDashboard.tsx    # Dashboard placeholder view
└── styles.css                    # Admin-specific style additions
```

> **Important:** There is no `routes/admin/` directory and no `login.tsx` sub-route. Everything lives in the single `admin.tsx` route file and its associated components.

---

## 4. Proposed Code Changes

### [NEW] [supabase.ts](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/lib/supabase.ts)

Supabase client singleton:
- Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment
- Exports `supabase` client instance via `createClient()`
- Shared between server functions and client-side auth state checks

### [NEW] [admin.server.ts](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/lib/admin.server.ts)

TanStack Start `createServerFn` functions:
- `getAdminSession()` — checks current Supabase auth session, returns `{ user, authorized }` or `{ user: null, authorized: false }`
- `adminLogin({ email, password })` — calls `supabase.auth.signInWithPassword()`, returns session data or error
- `adminLogout()` — calls `supabase.auth.signOut()`, clears session

### [NEW] [admin.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/routes/admin.tsx)

Single route file for the `/admin` slug:
1. Calls `getAdminSession()` in `beforeLoad` to check auth state
2. The `component` conditionally renders based on auth state:
   - **Not authenticated** → `AdminForbidden` component (403 screen, with hidden login trigger)
   - **Authenticated** → `AdminShell` component (sidebar + `AdminDashboard`)
3. Adds `head` meta: `{ name: "robots", content: "noindex, nofollow" }`
4. Manages a local `showLogin` React state — toggled by the secret trigger inside `AdminForbidden`
5. When `showLogin` is `true`, renders `AdminLogin` inline (overlaid or replacing the 403 content)

### [NEW] [AdminForbidden.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminForbidden.tsx)

Clean 403 "Access Denied" screen:
- Full-viewport, `stride-section-dark` background (`--ink`, `--text-on-dark`)
- Mono eyebrow label: `403 · FORBIDDEN`
- Large display heading: "Access denied."
- Muted body text: "You don't have permission to view this area."
- Ember-colored "Back to site" link → `/`
- **Contains the hidden login trigger** (exact mechanism TBD — see §2a). When triggered, calls an `onUnlock` callback prop to reveal the login form.
- No login form visible by default, no hints about how to unlock it
- Uses existing STRIDE typography: `font-display`, `eyebrow`, mono eyebrow pattern

### [NEW] [AdminLogin.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminLogin.tsx)

Admin login form rendered inline on `/admin` (not at a separate URL):
- Full-viewport, `stride-section-dark` background
- STRIDE logo at top + "Admin Portal" mono eyebrow
- Email + Password inputs using existing `Input` UI component
- Ember-colored "Sign In" button matching site CTA style (`--ember`, `--ember-foreground`)
- Error state with subtle shake animation + inline error message
- Loading state with disabled button + spinner
- On success: session established → page re-renders into `AdminShell`
- No "Register" or "Forgot password" links
- Responsive, vertically centered card layout

### [NEW] [AdminShell.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminShell.tsx)

Persistent admin dashboard shell using the existing `Sidebar` + `SidebarProvider`:
- **Sidebar** (left, dark `--ink` background, `--hairline-dark` borders):
  - Header: STRIDE logo + "Admin Portal" label
  - Navigation group with Lucide icons:
    - `LayoutDashboard` → Dashboard (`/admin`) — active by default
    - `CalendarCheck` → Bookings Management (`/admin/bookings`)
    - `Calendar` → Calendar (`/admin/calendar`)
    - `Users` → Patient Records (`/admin/patients`)
    - `UserCog` → Therapists & Schedule (`/admin/therapists`)
    - `Tag` → Services & Pricing (`/admin/services`)
    - `Settings` → Settings & Audit Logs (`/admin/settings`)
  - Active state highlighted with `--ember` accent
  - Footer: Admin email display + "Sign Out" button → calls `adminLogout()` → re-renders to 403 screen
- **Main content area** (`SidebarInset`):
  - Top bar with `SidebarTrigger` + current section title
  - `<Outlet />` for child route content
- Sidebar collapses to icon mode on smaller screens, uses `Sheet` on mobile
- All nav items except Dashboard render a "Coming Soon" placeholder for now

### [NEW] [AdminDashboard.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminDashboard.tsx)

Default dashboard view:
- Welcome header with admin's email
- Grid of stat cards using `Card` component from `@/components/ui/card`:
  - "Today's Appointments" — placeholder count
  - "Active Patients" — placeholder count
  - "This Month's Revenue" — placeholder amount
  - "Pending Bookings" — placeholder count
- Cards use `--ink` background, `--ember` accent for key numbers, `--muted-on-dark` for labels
- "Quick Actions" section with icon buttons
- All data is static placeholder — real data integration is a future milestone

### [MODIFY] [__root.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/routes/__root.tsx)

Modify `AppShell` to conditionally hide public site chrome on `/admin`:
- Use `useRouterState` to detect if pathname starts with `/admin`
- If admin route: render only the admin component (no SiteNav, Footer, BookingModal, or Lenis scroll)
- If public route: render existing SiteNav + main + Footer + BookingModal

### [MODIFY] [styles.css](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/styles.css)

Add admin-scoped styling:
- `[data-admin] [data-sidebar]` selectors for dark sidebar theming (`--sidebar-background`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-accent`)
- `@keyframes admin-shake` — subtle horizontal shake for login error feedback
- Admin card hover micro-interactions

### [MODIFY] [.env](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/.env)

Add Supabase credentials (user fills in their own values):
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 5. Admin Sidebar Navigation Tabs

| Icon | Label | Route | Status |
|------|-------|-------|--------|
| `LayoutDashboard` | Dashboard | `/admin` | Default view (placeholder) |
| `CalendarCheck` | Bookings Management | `/admin/bookings` | Coming Soon |
| `Calendar` | Calendar | `/admin/calendar` | Coming Soon |
| `Users` | Patient Records | `/admin/patients` | Coming Soon |
| `UserCog` | Therapists & Schedule | `/admin/therapists` | Coming Soon |
| `Tag` | Services & Pricing | `/admin/services` | Coming Soon |
| `Settings` | Settings & Audit Logs | `/admin/settings` | Coming Soon |

---

## 6. Design Decisions

1. **Single slug (`/admin`) — no `/admin/login`**: There is exactly one admin URL. Non-admins always see a 403 screen. The login form is revealed only by a secret interaction on that same page, with no URL change. This eliminates any publicly discoverable admin login endpoint.

2. **Hidden login trigger**: The mechanism for the admin to reveal the login form (key sequence, hidden click zone, etc.) is intentionally undocumented in any user-facing interface. See §2a for the options to be decided.

3. **Supabase Auth**: Chosen for credential storage and session management. No self-registration; admin accounts are provisioned via the Supabase dashboard. This means no signup form, no password reset form — pure backend control.

4. **Sidebar shell**: Leverages the existing shadcn/ui `Sidebar` component already present in the project (`src/components/ui/sidebar.tsx`), themed with the STRIDE dark palette for visual cohesion.

5. **Root layout isolation**: The `AppShell` in `__root.tsx` detects `/admin` and skips the public site chrome (SiteNav, Footer, BookingModal, Lenis smooth scroll), so the admin portal has a clean, independent layout.

6. **SEO exclusion**: The `/admin` route includes `noindex, nofollow` meta tags to prevent search engine indexing.

---

## 7. Verification & Testing Plan

### Automated Verification
```bash
npm run build
```
Build must succeed — validates route tree generation, TypeScript types, and import resolution.

### Manual Verification
1. **403 Gate**: Navigate to `/admin` without auth → see "Access Denied" screen. No login form, no site nav, no footer.
2. **Hidden Trigger**: Perform the secret interaction → login form appears inline on the same `/admin` page. No URL change.
3. **Invalid Credentials**: Enter wrong email/password → see error message with shake animation.
4. **Valid Credentials**: Enter correct admin email/password → page transitions to dashboard shell with sidebar.
5. **Sidebar Navigation**: Click each nav item → see placeholder "Coming Soon" content (Dashboard shows stat cards).
6. **Sign Out**: Click "Sign Out" in sidebar → session cleared → page transitions back to 403 screen.
7. **Public Site Unaffected**: Navigate to `/` → confirm SiteNav, Footer, BookingModal all render normally.
8. **Session Persistence**: Refresh `/admin` while logged in → session persists, dashboard renders without re-triggering the login form.
